import {
  CommonModule,
  isPlatformBrowser,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Bitstream } from '../../../../../app/core/shared/bitstream.model';
import { FileService } from '../../../../../app/core/shared/file.service';
import { BtnDisabledDirective } from '../../../../../app/shared/btn-disabled.directive';

/**
 * Minimal PDF.js interfaces used by this component.
 *
 * PDF.js is loaded from /assets/pdfjs rather than imported into the Angular
 * SSR bundle. This prevents Webpack from attempting to bundle canvas.node.
 */
interface PdfJsViewport {
  width: number;
  height: number;
}

interface PdfJsRenderTask {
  promise: Promise<void>;
}

interface PdfJsPage {
  getViewport(options: {
    scale: number;
  }): PdfJsViewport;

  render(options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
    transform?: number[];
  }): PdfJsRenderTask;
}

interface PdfJsDocument {
  numPages: number;

  getPage(pageNumber: number): Promise<PdfJsPage>;

  destroy(): Promise<void>;
}

interface PdfJsLoadingTask {
  promise: Promise<PdfJsDocument>;
}

interface PdfJsLibrary {
  GlobalWorkerOptions: {
    workerSrc: string;
  };

  getDocument(options: {
    url?: string;
    data?: Uint8Array;
    withCredentials?: boolean;
    disableAutoFetch?: boolean;
    disableStream?: boolean;
    disableRange?: boolean;
    rangeChunkSize?: number;
    isEvalSupported?: boolean;
  }): PdfJsLoadingTask;
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLibrary;
  }
}

@Component({
  selector: 'ds-view-only-pdf',
  templateUrl: './view-only-pdf.component.html',
  styleUrls: ['./view-only-pdf.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BtnDisabledDirective,
  ],
})
export class ViewOnlyPdfComponent implements AfterViewInit, OnDestroy {

  /** PDF bitstream supplied by the themed item file section. */
  @Input() bitstream!: Bitstream;

  /** Watermark displayed over each rendered page. */
  @Input() watermarkText = 'ONLINE VIEW ONLY';

  /** Number of pages added when the user selects “Load more pages”. */
  @Input() pagesPerBatch = 2;

  /** Canvas elements generated for the currently visible pages. */
  @ViewChildren('pdfCanvas')
  canvasElements!: QueryList<ElementRef<HTMLCanvasElement>>;

  pdfDocument?: PdfJsDocument;

  pageNumbers: number[] = [];
  visiblePageNumbers: number[] = [];

  loading = true;
  rendering = false;
  accessDenied = false;
  errorMessage = '';

  scale = 1.0;

  private destroyed = false;

  /** Size of each HTTP byte-range request made by PDF.js. */
  private readonly rangeChunkSize = 262144;

  /** Prevent excessive canvas memory use on high-DPI screens. */
  private readonly maximumOutputScale = 1.5;

  /** Number of pages added by the larger progressive-load action. */
  private readonly largePageBatchSize = 10;

  /**
   * Cache-busted browser assets. These files must exist in src/assets/pdfjs.
   */
  private readonly pdfJsScriptUrl =
    '/assets/pdfjs/pdf.min.js?v=3.11.174';

  private readonly pdfJsWorkerUrl =
    '/assets/pdfjs/pdf.worker.min.js?v=3.11.174';

  constructor(
    private readonly fileService: FileService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    @Inject(PLATFORM_ID)
    private readonly platformId: object,
  ) {
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.bitstream?.uuid) {
      this.loading = false;
      this.errorMessage = 'No PDF bitstream was supplied.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    await this.loadPdf();
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.pdfDocument) {
      void this.pdfDocument.destroy();
    }
  }

  /**
   * Load the PDF through DSpace FileService so restricted files receive a
   * short-lived authentication token.
   */
  private async loadPdf(): Promise<void> {
    this.loading = true;
    this.rendering = false;
    this.accessDenied = false;
    this.errorMessage = '';

    try {
      const pdfjs = await this.loadPdfJsLibrary();

      pdfjs.GlobalWorkerOptions.workerSrc =
        this.pdfJsWorkerUrl;

      if (!this.bitstream.uuid) {
        throw new Error('The bitstream UUID is unavailable.');
      }

      /*
       * Use the browser's current origin. This avoids following a bitstream
       * self-link that may contain a different public hostname or proxy.
       */
      const contentUrl =
        `${window.location.origin}` +
        '/server/api/core/bitstreams/' +
        `${this.bitstream.uuid}/content`;

      const authorizedContentUrl = await firstValueFrom(
        this.fileService.retrieveFileDownloadLink(contentUrl),
      );

      if (!authorizedContentUrl) {
        throw new Error(
          'An authorized PDF URL could not be generated.',
        );
      }

      /*
       * Allow PDF.js to request only the byte ranges required for the current
       * pages. This avoids downloading the entire PDF before page 1 appears.
       */
      const loadingTask = pdfjs.getDocument({
        url: authorizedContentUrl,
        withCredentials: true,
        disableAutoFetch: true,
        disableStream: false,
        disableRange: false,
        rangeChunkSize: this.rangeChunkSize,
        isEvalSupported: false,
      });

      this.pdfDocument = await loadingTask.promise;

      this.pageNumbers = Array.from(
        { length: this.pdfDocument.numPages },
        (_, index) => index + 1,
      );

      const initialPageCount = Math.min(
        Math.max(this.pagesPerBatch, 1),
        this.pageNumbers.length,
      );

      this.visiblePageNumbers =
        this.pageNumbers.slice(0, initialPageCount);

      this.loading = false;
      this.changeDetectorRef.detectChanges();

      await this.waitForCanvasCreation();
      await this.renderPagesFrom(0);
    } catch (error: unknown) {
      console.error('Unable to load view-only PDF', error);

      this.loading = false;
      this.rendering = false;

      const httpStatus = this.getHttpStatus(error);

      if (httpStatus === 401 || httpStatus === 403) {
        this.accessDenied = true;
        this.errorMessage =
          'You are not authorized to view this document. ' +
          'Please log in with an authorized account.';
      } else {
        const diagnosticMessage =
          error instanceof Error
            ? error.message
            : String(error);

        this.errorMessage =
          'The document preview could not be loaded: ' +
          diagnosticMessage;
      }

      this.changeDetectorRef.detectChanges();
    }
  }

  /** Load PDF.js as a browser script without adding it to the SSR bundle. */
  private async loadPdfJsLibrary(): Promise<PdfJsLibrary> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('PDF.js can only be loaded in the browser.');
    }

    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        `script[src="${this.pdfJsScriptUrl}"]`,
      );

    if (existingScript) {
      await this.waitForPdfJs(existingScript);

      if (!window.pdfjsLib) {
        throw new Error(
          'PDF.js loaded but did not expose pdfjsLib.',
        );
      }

      return window.pdfjsLib;
    }

    const script = document.createElement('script');

    script.src = this.pdfJsScriptUrl;
    script.async = true;
    script.dataset.pdfjsViewer = 'true';

    document.head.appendChild(script);

    await this.waitForPdfJs(script);

    if (!window.pdfjsLib) {
      throw new Error(
        'PDF.js loaded but did not expose pdfjsLib.',
      );
    }

    return window.pdfjsLib;
  }

  private waitForPdfJs(
    script: HTMLScriptElement,
  ): Promise<void> {
    if (window.pdfjsLib) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const handleLoad = (): void => {
        cleanup();

        if (window.pdfjsLib) {
          resolve();
        } else {
          reject(
            new Error(
              'The PDF.js global object is unavailable.',
            ),
          );
        }
      };

      const handleError = (): void => {
        cleanup();

        reject(
          new Error(
            `Unable to load PDF.js from ${this.pdfJsScriptUrl}.`,
          ),
        );
      };

      const cleanup = (): void => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };

      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
    });
  }

  /** Return true while additional PDF pages are available. */
  hasMorePages(): boolean {
    return this.visiblePageNumbers.length < this.pageNumbers.length;
  }

  /** Add the next small batch of PDF pages. */
  async loadMorePages(): Promise<void> {
    if (this.rendering || !this.hasMorePages()) {
      return;
    }

    const previousCount = this.visiblePageNumbers.length;
    const nextCount = Math.min(
      previousCount + Math.max(this.pagesPerBatch, 1),
      this.pageNumbers.length,
    );

    this.visiblePageNumbers =
      this.pageNumbers.slice(0, nextCount);

    this.changeDetectorRef.detectChanges();
    await this.waitForCanvasCreation();
    await this.renderPagesFrom(previousCount);
  }

  /** Add a larger, but still controlled, batch of PDF pages. */
  async loadNextLargeBatch(): Promise<void> {
    if (this.rendering || !this.hasMorePages()) {
      return;
    }

    const previousCount = this.visiblePageNumbers.length;
    const nextCount = Math.min(
      previousCount + this.largePageBatchSize,
      this.pageNumbers.length,
    );

    this.visiblePageNumbers =
      this.pageNumbers.slice(0, nextCount);

    this.changeDetectorRef.detectChanges();
    await this.waitForCanvasCreation();
    await this.renderPagesFrom(previousCount);
  }

  /** Render every currently visible page, used after changing zoom. */
  private async renderAllVisiblePages(): Promise<void> {
    await this.renderPagesFrom(0);
  }

  /** Render visible pages beginning at the specified array index. */
  private async renderPagesFrom(
    startIndex: number,
  ): Promise<void> {
    if (
      !this.pdfDocument ||
      !this.canvasElements ||
      this.destroyed ||
      !isPlatformBrowser(this.platformId)
    ) {
      return;
    }

    this.rendering = true;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    try {
      for (
        let index = startIndex;
        index < this.visiblePageNumbers.length;
        index++
      ) {
        if (this.destroyed) {
          return;
        }

        const canvasReference =
          this.canvasElements.get(index);

        if (!canvasReference) {
          continue;
        }

        await this.renderPage(
          this.visiblePageNumbers[index],
          canvasReference.nativeElement,
        );

        /* Yield between pages so controls and scrolling remain responsive. */
        await new Promise<void>(
          resolve => setTimeout(resolve, 0),
        );
      }
    } catch (error: unknown) {
      console.error('Unable to render PDF pages', error);

      this.errorMessage =
        'One or more PDF pages could not be rendered.';
    } finally {
      this.rendering = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
  ): Promise<void> {
    if (!this.pdfDocument) {
      return;
    }

    const page =
      await this.pdfDocument.getPage(pageNumber);

    const viewport = page.getViewport({
      scale: this.scale,
    });

    const outputScale = Math.min(
      window.devicePixelRatio || 1,
      this.maximumOutputScale,
    );

    const context = canvas.getContext(
      '2d',
      { alpha: false },
    );

    if (!context) {
      throw new Error('Canvas rendering is unavailable.');
    }

    canvas.width = Math.floor(
      viewport.width * outputScale,
    );

    canvas.height = Math.floor(
      viewport.height * outputScale,
    );

    canvas.style.width =
      `${Math.floor(viewport.width)}px`;

    canvas.style.height =
      `${Math.floor(viewport.height)}px`;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const transform = outputScale !== 1
      ? [outputScale, 0, 0, outputScale, 0, 0]
      : undefined;

    await page.render({
      canvasContext: context,
      viewport,
      transform,
    }).promise;
  }

  async zoomIn(): Promise<void> {
    if (this.rendering || this.scale >= 2.5) {
      return;
    }

    this.scale = Number(
      Math.min(this.scale + 0.15, 2.5).toFixed(2),
    );

    await this.renderAllVisiblePages();
  }

  async zoomOut(): Promise<void> {
    if (this.rendering || this.scale <= 0.65) {
      return;
    }

    this.scale = Number(
      Math.max(this.scale - 0.15, 0.65).toFixed(2),
    );

    await this.renderAllVisiblePages();
  }

  async resetZoom(): Promise<void> {
    if (this.rendering) {
      return;
    }

    this.scale = 1.0;
    await this.renderAllVisiblePages();
  }

  preventContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  preventDrag(event: DragEvent): void {
    event.preventDefault();
  }

  trackPageNumber(
    _index: number,
    pageNumber: number,
  ): number {
    return pageNumber;
  }

  private waitForCanvasCreation(): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(resolve, 0);
    });
  }

  private getHttpStatus(
    error: unknown,
  ): number | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      const status =
        (error as { status?: unknown }).status;

      return typeof status === 'number'
        ? status
        : undefined;
    }

    return undefined;
  }
}
