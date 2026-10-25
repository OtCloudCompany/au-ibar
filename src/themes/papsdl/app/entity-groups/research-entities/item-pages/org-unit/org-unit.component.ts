import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Context } from '@dspace/core/shared/context.model';
import { ViewMode } from '@dspace/core/shared/view-mode.model';
import { TranslateModule } from '@ngx-translate/core';

import { OrgUnitComponent as BaseComponent } from '../../../../../../../app/entity-groups/research-entities/item-pages/org-unit/org-unit.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { TabbedRelatedEntitiesSearchComponent } from '../../../../../../../app/item-page/simple/related-entities/tabbed-related-entities-search/tabbed-related-entities-search.component';
import { DsoEditMenuComponent } from '../../../../../../../app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../../../../app/shared/results-back-button/themed-results-back-button.component';

/**
 * AU-IBAR (25 Oct 2026): organisation page listing the publications the organisation authored,
 * edited or funded (relationships isAuthorOfPublication, isEditorOfPublication, isFunderOfPublication).
 */
@listableObjectComponent('OrgUnit', ViewMode.StandalonePage, Context.Any, 'papsdl')
@Component({
  selector: 'ds-themed-org-unit',
  styleUrls: ['./org-unit.component.scss'],
  templateUrl: './org-unit.component.html',
  imports: [
    AsyncPipe,
    DsoEditMenuComponent,
    RouterLink,
    TabbedRelatedEntitiesSearchComponent,
    ThemedItemPageTitleFieldComponent,
    ThemedResultsBackButtonComponent,
    TranslateModule,
  ],
})
export class OrgUnitComponent extends BaseComponent implements OnInit {
  /** Publication lists shown as tabs; the filter is the relation field indexed in Solr. */
  readonly publicationTabs = [
    { label: 'auibarOrgAuthored', filter: 'isAuthorOfPublication', configuration: 'default-relationships' },
    { label: 'auibarOrgEdited', filter: 'isEditorOfPublication', configuration: 'default-relationships' },
    { label: 'auibarOrgFunded', filter: 'isFunderOfPublication', configuration: 'default-relationships' },
  ];

  /** Tabs for the relationships this organisation actually has (computed once). */
  tabs: { label: string; filter: string; configuration: string }[] = [];

  ngOnInit(): void {
    super.ngOnInit();
    const reverse = { isAuthorOfPublication: 'isPublicationOfAuthor', isEditorOfPublication: 'isPublicationOfEditor', isFunderOfPublication: 'isPublicationOfFunder' };
    const tabs = this.publicationTabs.filter((t) => this.object?.hasMetadata(`relation.${reverse[t.filter]}`));
    this.tabs = tabs.length ? tabs : this.publicationTabs.slice(0, 1);
  }
}
