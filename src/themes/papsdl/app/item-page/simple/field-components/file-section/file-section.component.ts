import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { Bitstream } from '../../../../../../../app/core/shared/bitstream.model';
import { FileSectionComponent as BaseComponent } from '../../../../../../../app/item-page/simple/field-components/file-section/file-section.component';
import { slideSidebarPadding } from '../../../../../../../app/shared/animations/slide';
import { ThemedFileDownloadLinkComponent } from '../../../../../../../app/shared/file-download-link/themed-file-download-link.component';
import { ThemedLoadingComponent } from '../../../../../../../app/shared/loading/themed-loading.component';
import { MetadataFieldWrapperComponent } from '../../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { VarDirective } from '../../../../../../../app/shared/utils/var.directive';
import { ViewOnlyPdfComponent } from '../../../../shared/view-only-pdf/view-only-pdf.component';

@Component({
  selector: 'ds-themed-item-page-file-section',
  templateUrl: './file-section.component.html',
  animations: [slideSidebarPadding],
  imports: [
    CommonModule,
    ThemedFileDownloadLinkComponent,
    MetadataFieldWrapperComponent,
    ThemedLoadingComponent,
    TranslateModule,
    VarDirective,
    ViewOnlyPdfComponent,
  ],
})
export class FileSectionComponent extends BaseComponent {


  // AU-IBAR: identify the type of an attached file.
  getFileType(file: Bitstream):
    'pdf' | 'video' | 'audio' | 'image' | 'other' {

    const name =
      (this.dsoNameService.getName(file) || '')
        .toLowerCase().split(/[?#]/)[0];

    const format =
      (file.firstMetadataValue('dc.format') || '')
        .toLowerCase();

    if (name.endsWith('.pdf') || format.includes('pdf')) {
      return 'pdf';
    }

    if (
      /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/.test(name) ||
      format.startsWith('video/')
    ) {
      return 'video';
    }

    if (
      /\.(mp3|wav|ogg|m4a|flac|aac)$/.test(name) ||
      format.startsWith('audio/')
    ) {
      return 'audio';
    }

    if (
      /\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff|svg)$/.test(name) ||
      format.startsWith('image/')
    ) {
      return 'image';
    }

    return 'other';
  }

  getFileIcon(file: Bitstream): string {
    switch (this.getFileType(file)) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'video':
        return 'fas fa-file-video';
      case 'audio':
        return 'fas fa-file-audio';
      case 'image':
        return 'fas fa-file-image';
      default:
        return 'fas fa-file';
    }
  }

  getDownloadLabel(file: Bitstream): string {
    switch (this.getFileType(file)) {
      case 'pdf':
        return 'Download PDF';
      case 'video':
        return 'Download Video';
      case 'audio':
        return 'Download Audio';
      case 'image':
        return 'Download Image';
      default:
        return 'Download File';
    }
  }

  getFileDescription(file: Bitstream): string {
    let fileDescription: string;

    if (file?.metadata['dc.description']) {
      fileDescription =
        file.metadata['dc.description'][0].value;
    } else {
      fileDescription =
        this.dsoNameService.getName(file) || 'Undefined';
    }

    return fileDescription;
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

  getViewOnlyPdf(
    bitstreams: Bitstream[] | null | undefined,
  ): Bitstream | undefined {
    return bitstreams?.find(
      (file: Bitstream) => this.isPdf(file),
    );
  }
}
