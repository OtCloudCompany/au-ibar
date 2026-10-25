import {
  AsyncPipe,
  NgFor,
  NgIf,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { Context } from '@dspace/core/shared/context.model';
import { Item } from '@dspace/core/shared/item.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageNamePipe } from '../../../../shared/utils/language-name.pipe';



import { CollectionsComponent } from '../../../../../../../app/item-page/field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from '../../../../../../../app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../../../../../app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from '../../../../../../../app/item-page/simple/field-components/file-section/themed-file-section.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { PublicationComponent } from '../publication/publication.component';
import { DsoEditMenuComponent } from '../../../../../../../app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from '../../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../../../../app/shared/results-back-button/themed-results-back-button.component';
import { ThemedThumbnailComponent } from '../../../../../../../app/thumbnail/themed-thumbnail.component';
import { DocumentPreviewComponent } from '../publication/document-preview/document-preview.component';
import { RelatedItemsComponent } from '../../../../../../../app/item-page/simple/related-items/related-items-component';

@listableObjectComponent(
  Item,
  ViewMode.StandalonePage,
  Context.Any,
  'papsdl',
)
@Component({
  selector: 'ds-untyped-item',
  templateUrl: '../publication/publication.component.html',
  styleUrls: ['../publication/publication.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RelatedItemsComponent,
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

export class UntypedItemComponent extends PublicationComponent {
}
