import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { Bitstream } from '../../../../../../../../app/core/shared/bitstream.model';
import { FileSectionComponent as BaseFileSectionComponent } from '../../../../../../../../app/item-page/simple/field-components/file-section/file-section.component';
import { ThemedFileDownloadLinkComponent } from '../../../../../../../../app/shared/file-download-link/themed-file-download-link.component';

import { ViewOnlyPdfComponent } from '../../../../../shared/view-only-pdf/view-only-pdf.component';

@Component({
  selector: 'ds-paps-document-preview',
  templateUrl: './document-preview.component.html',
  styleUrls: ['./document-preview.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ThemedFileDownloadLinkComponent,
    ViewOnlyPdfComponent,
  ],
})
export class DocumentPreviewComponent extends BaseFileSectionComponent {

  expanded = true;

  /** User-selected bitstream. Empty means use the preferred PDF. */
  selectedPdfUuid = '';

  /** List only PDFs, excluding images and other attachments. */
  getAvailablePdfs(
    bitstreams: Bitstream[] | null | undefined,
  ): Bitstream[] {
    return bitstreams?.filter(
      (file: Bitstream) => this.isPdf(file),
    ) ?? [];
  }

  /** Resolve the current selection, defaulting to English/first PDF. */
  getSelectedPdf(
    bitstreams: Bitstream[] | null | undefined,
  ): Bitstream | undefined {

    const pdfs = this.getAvailablePdfs(bitstreams);

    if (this.selectedPdfUuid) {
      const selected = pdfs.find(
        (file: Bitstream) => file.uuid === this.selectedPdfUuid,
      );

      if (selected) {
        return selected;
      }
    }

    return this.getPreviewPdf(bitstreams);
  }

  selectPdf(uuid: string): void {
    this.selectedPdfUuid = uuid;
  }

  /**
   * Recreate the PDF viewer when the selected UUID changes.
   * Prevents the previous document remaining in the reader.
   */
  trackByPdfUuid(_index: number, file: Bitstream): string {
    return file.uuid;
  }


  togglePreview(): void {
    this.expanded = !this.expanded;
  }

  isViewOnlyItem(): boolean {
    const accessMode =
      this.item?.firstMetadataValue('local.access.mode');

    return accessMode === 'view-only' ||
      accessMode === 'restricted-view';
  }

  isPdf(file: Bitstream): boolean {
    if (!file) {
      return false;
    }

    const fileName =
      this.dsoNameService.getName(file)
        ?.toLowerCase() ?? '';

    const dcFormat =
      file.firstMetadataValue('dc.format')
        ?.toLowerCase() ?? '';

    return fileName.endsWith('.pdf') ||
      dcFormat === 'application/pdf' ||
      dcFormat.includes('pdf');
  }


  // AU-IBAR: describe PDF language without changing the filename.
  getPdfDisplayLabel(file: Bitstream): string {
    const description = this.getFileDescription(file);
    const filename = this.dsoNameService.getName(file) || '';

    const combined = `${description} ${filename}`.toLowerCase();

    const names: Record<string, string> = {
      en: 'English',
      fr: 'French',
      ar: 'Arabic',
      pt: 'Portuguese',
      es: 'Spanish',
      sw: 'Swahili',
    };

    const metadataLanguage =
      file.firstMetadataValue('dc.language.iso') ||
      file.firstMetadataValue('dc.language') ||
      '';

    const normalized = metadataLanguage.toLowerCase()
      .split(/[-_]/)[0];

    let language = names[normalized];

    if (!language) {
      for (const [code, label] of Object.entries(names)) {
        const pattern = new RegExp(
          `(?:^|[\\s._-])${code}(?=$|[\\s._-])`,
          'i',
        );

        if (pattern.test(combined)) {
          language = label;
          break;
        }
      }
    }

    return language
      ? `${language} — ${description}`
      : description;
  }

  getFileDescription(file: Bitstream): string {
    if (file?.metadata?.['dc.description']?.length) {
      return file.metadata['dc.description'][0].value;
    }

    return this.dsoNameService.getName(file) || 'PDF document';
  }

  getPreviewPdf(
    bitstreams: Bitstream[] | null | undefined,
  ): Bitstream | undefined {

    const pdfs = bitstreams?.filter(
      (file: Bitstream) => this.isPdf(file),
    ) ?? [];

    if (!pdfs.length) {
      return undefined;
    }

    /*
     * PSC preference:
     * Prefer an English-labelled PDF when available.
     * Examples:
     *   Communiqué - EN
     *   Programme - EN
     */
    const englishPdf = pdfs.find((file: Bitstream) => {
      const description =
        this.getFileDescription(file).trim().toLowerCase();

      const fileName =
        this.dsoNameService.getName(file)
          ?.trim()
          .toLowerCase() ?? '';

      return (
        description.endsWith('- en') ||
        description.endsWith('– en') ||
        description.endsWith('— en') ||
        /\ben\b/.test(description) ||
        /[-_ ]en(?:\.pdf)?$/.test(fileName)
      );
    });

    return englishPdf ?? pdfs[0];
  }

  getPdfCount(
    bitstreams: Bitstream[] | null | undefined,
  ): number {
    return bitstreams?.filter(
      (file: Bitstream) => this.isPdf(file),
    ).length ?? 0;
  }
}
