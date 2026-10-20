import {
  AsyncPipe,
  NgForOf,
  NgIf,
} from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { Bitstream } from '../../../../../../../app/core/shared/bitstream.model';
import { FullFileSectionComponent as BaseComponent } from '../../../../../../../app/item-page/full/field-components/file-section/full-file-section.component';
import { ThemedFileDownloadLinkComponent } from '../../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import { MetadataFieldWrapperComponent } from '../../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { PaginationComponent } from '../../../../../../../app/shared/pagination/pagination.component';
import { FileSizePipe } from '../../../../../../../app/shared/utils/file-size-pipe';
import { VarDirective } from '../../../../../../../app/shared/utils/var.directive';
import { ThemedThumbnailComponent } from '../../../../../../../app/thumbnail/themed-thumbnail.component';
import { ViewOnlyPdfComponent } from '../../../../shared/view-only-pdf/view-only-pdf.component';

@Component({
  selector: 'ds-themed-item-page-full-file-section',
  templateUrl: './full-file-section.component.html',
  styleUrls: [
    '../../../../../../../app/item-page/full/field-components/file-section/full-file-section.component.scss',
  ],
  imports: [
    AsyncPipe,
    FileSizePipe,
    MetadataFieldWrapperComponent,
    NgForOf,
    NgIf,
    PaginationComponent,
    ThemedFileDownloadLinkComponent,
    ThemedThumbnailComponent,
    TranslateModule,
    VarDirective,
    ViewOnlyPdfComponent,
  ],
})
export class FullFileSectionComponent extends BaseComponent {

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

  getViewOnlyPdf(
    bitstreams: Bitstream[] | null | undefined,
  ): Bitstream | undefined {
    return bitstreams?.find(
      (file: Bitstream) => this.isPdf(file),
    );
  }
}
