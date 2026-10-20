import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MediaViewerItem } from '@dspace/core/shared/media-viewer-item.model';
import { NgxGalleryAnimation, NgxGalleryImage } from '@kolkov/ngx-gallery';
import { NgxGalleryModule } from '@kolkov/ngx-gallery';

import { MediaViewerImageComponent as BaseComponent } from '../../../../../../app/item-page/media-viewer/media-viewer-image/media-viewer-image.component';

@Component({
  selector: 'ds-themed-media-viewer-image',
  // templateUrl: './media-viewer-image.component.html',
  templateUrl: './media-viewer-image.component.html',
  // styleUrls: ['./media-viewer-image.component.scss'],
  styleUrls: ['../../../../../../app/item-page/media-viewer/media-viewer-image/media-viewer-image.component.scss'],
  imports: [
    AsyncPipe,
    NgxGalleryModule,
  ],
})
export class MediaViewerImageComponent extends BaseComponent {

  // AU-IBAR: control page tabs during gallery lightbox viewing.
  onGalleryPreviewOpen(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('auibar-gallery-preview-open');
    }
  }

  onGalleryPreviewClose(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('auibar-gallery-preview-open');
    }
  }

  // AU-IBAR: full-resolution image gallery
  override ngOnChanges(): void {
    super.ngOnChanges();

    const multipleImages =
      (this.images?.filter(media => media.format === 'image').length || 0) > 1;

    this.galleryOptions = [
      {
        preview: this.preview !== undefined ? this.preview : true,
        image: true,
        imageSize: 'contain',
        imagePercent: 100,
        thumbnails: multipleImages,
        thumbnailsColumns: 5,
        thumbnailsRows: 1,
        imageArrows: multipleImages,
        startIndex: 0,
        imageAnimation: NgxGalleryAnimation.Slide,
        previewCloseOnEsc: true,
        previewZoom: true,
        previewRotate: true,
        previewFullscreen: true,
      },
    ];
  }

  override convertToGalleryImage(
    medias: MediaViewerItem[],
  ): NgxGalleryImage[] {
    return (medias || [])
      .filter(media => media.format === 'image')
      .map(media => {
        const original =
          media.bitstream._links.content.href +
          (media.accessToken
            ? '?accessToken=' + encodeURIComponent(media.accessToken)
            : '');

        const thumbnail = media.thumbnail || original;

        return {
          small: thumbnail,
          medium: original,
          big: original,
        };
      });
  }
}
