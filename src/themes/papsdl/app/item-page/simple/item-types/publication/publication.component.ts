import {
  AsyncPipe,
  NgFor,
  NgIf,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { Context } from '@dspace/core/shared/context.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageNamePipe } from '../../../../../../../app/shared/utils/language-name.pipe';

import {
  defer,
  map,
  of,
  shareReplay,
} from 'rxjs';

import { ItemDataService } from '../../../../../../../app/core/data/item-data.service';
import { getFirstCompletedRemoteData } from '../../../../../../../app/core/shared/operators';
import { CollectionsComponent } from '../../../../../../../app/item-page/field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from '../../../../../../../app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../../../../../app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from '../../../../../../../app/item-page/simple/field-components/file-section/themed-file-section.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { PublicationComponent as BaseComponent } from '../../../../../../../app/item-page/simple/item-types/publication/publication.component';
import { DsoEditMenuComponent } from '../../../../../../../app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from '../../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../../../../app/shared/results-back-button/themed-results-back-button.component';
import { ThemedThumbnailComponent } from '../../../../../../../app/thumbnail/themed-thumbnail.component';
import { DocumentPreviewComponent } from './document-preview/document-preview.component';

@listableObjectComponent(
  'Publication',
  ViewMode.StandalonePage,
  Context.Any,
  'papsdl',
)
@Component({
  selector: 'ds-publication',
  templateUrl: './publication.component.html',
  styleUrls: ['./publication.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LanguageNamePipe,
    AsyncPipe,
    CollectionsComponent,
    DocumentPreviewComponent,
    DsoEditMenuComponent,
    MetadataFieldWrapperComponent,
    MiradorViewerComponent,
    NgFor,
    NgIf,
    RouterLink,
    ThemedFileSectionComponent,
    ThemedItemPageTitleFieldComponent,
    ThemedMediaViewerComponent,
    ThemedResultsBackButtonComponent,
    ThemedThumbnailComponent,
    TranslateModule,
  ],
})
export class PublicationComponent extends BaseComponent {

  private readonly itemDataService = inject(ItemDataService);

  /**
   * Load this Item once using DSpace's allLanguages projection.
   *
   * The normal Item REST representation may expose only the preferred
   * language for multilingual metadata. The allLanguages projection gives
   * us every dc.description.abstract value in one REST response.
   *
   * defer() is intentional: object is an @Input() and is available by the
   * time the template subscribes to this Observable.
   */
  readonly abstractValues$ = defer(() => {

    const href = this.object?.self;

    if (!href) {
      return of(this.getAbstractValues());
    }

    const separator = href.includes('?') ? '&' : '?';

    return this.itemDataService
      .findByHref(
        `${href}${separator}projection=allLanguages`,
        true,
        true,
      )
      .pipe(
        getFirstCompletedRemoteData(),
        map((rd) =>
          rd.payload?.metadata?.['dc.description.abstract']
          ?? this.getAbstractValues()
        ),
      );

  }).pipe(
    shareReplay({
      bufferSize: 1,
      refCount: false,
    }),
  );

  /**
   * Primary reading panel shown below the item hero.
   * Abstract remains the default so PDF.js is not instantiated
   * until the visitor explicitly requests the preview.
   */

  // AU-IBAR: content-aware media preview
  getRecordMediaType(): 'video' | 'image' | 'pdf' {
    const type = (
      this.object?.firstMetadataValue(['dc.type']) || ''
    ).toLowerCase().trim();

    if (
      type.includes('video') ||
      type.includes('moving image') ||
      type.includes('audiovisual') ||
      type.includes('audio')
    ) {
      return 'video';
    }

    if (
      type.includes('image') ||
      type.includes('photograph') ||
      type.includes('photo') ||
      type.includes('picture')
    ) {
      return 'image';
    }

    return 'pdf';
  }

  getPreviewTabLabel(): string {
    switch (this.getRecordMediaType()) {
      case 'video':
        return 'Watch Video';
      case 'image':
        return 'View Images';
      default:
        return 'Document Preview';
    }
  }

  isMultimediaRecord(): boolean {
    return this.getRecordMediaType() !== 'pdf';
  }

  activeRecordTab: 'abstract' | 'preview' = 'abstract';

  /**
   * Selected language within the Abstract tab.
   *
   * null means:
   *   1. prefer English when available;
   *   2. otherwise show the first available abstract.
   */
  activeAbstractLanguage: string | null = null;

  getAbstractValues(): any[] {
    return this.object?.metadata?.['dc.description.abstract'] ?? [];
  }

  getAbstractLanguage(value: any): string {
    return value?.language || 'und';
  }

  getSelectedAbstract(values: any[]): any | undefined {
    if (!values?.length) {
      return undefined;
    }

    if (this.activeAbstractLanguage) {
      const selected = values.find(
        (value: any) =>
          this.getAbstractLanguage(value) === this.activeAbstractLanguage,
      );

      if (selected) {
        return selected;
      }
    }

    const english = values.find(
      (value: any) => this.getAbstractLanguage(value) === 'en',
    );

    return english ?? values[0];
  }

  selectAbstractLanguage(language: string): void {
    this.activeAbstractLanguage = language;
  }


  // AU-IBAR: human-readable language names for item metadata.
  getLanguageName(code: string): string {
    const labels: Record<string, string> = {
      en: 'English',
      fr: 'French',
      ar: 'Arabic',
      pt: 'Portuguese',
      es: 'Spanish',
      sw: 'Swahili',
      und: 'Not specified',
    };

    const normalized = (code || '').trim().toLowerCase();
    const primary = normalized.split(/[-_]/)[0];

    return labels[normalized] ??
      labels[primary] ??
      code;
  }

  getAbstractLanguageLabel(language: string): string {
    const labels: Record<string, string> = {
      en: 'English',
      fr: 'Français',
      ar: 'العربية',
      pt: 'Português',
      es: 'Español',
      sw: 'Kiswahili',
      und: 'Abstract',
    };

    return labels[language] ?? language.toUpperCase();
  }

  isRtlAbstract(value: any): boolean {
    const language = this.getAbstractLanguage(value);

    return ['ar', 'fa', 'he', 'ur'].includes(language);
  }


}
