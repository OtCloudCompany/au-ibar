import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  Params,
  Router,
  RouterLink,
} from '@angular/router';
import { PaginationService } from '@dspace/core/pagination/pagination.service';
import { currentPath } from '@dspace/core/router/utils/route.utils';
import { AppliedFilter } from '@dspace/core/shared/search/models/applied-filter.model';
import { TranslateModule } from '@ngx-translate/core';
import {
  LANGUAGE_FILTERS,
  LanguageNamePipe,
} from '../../../utils/language-name.pipe';
import { Observable } from 'rxjs';

import { SearchService } from '../../search.service';
import { SearchConfigurationService } from '../../search-configuration.service';
import { SearchFilterService } from '../../search-filters/search-filter.service';

/**
 * Component that represents the label containing the currently active filters
 */
@Component({
  selector: 'ds-search-label',
  templateUrl: './search-label.component.html',
  styleUrls: ['./search-label.component.scss'],
  imports: [
    AsyncPipe,
    LanguageNamePipe,
    RouterLink,
    TranslateModule,
  ],
})
export class SearchLabelComponent implements OnInit {
  /** AU-IBAR: values of this filter are ISO language codes, shown as language names */
  get isLanguageFilter(): boolean {
    return LANGUAGE_FILTERS.includes(this.appliedFilter?.filter);
  }

  @Input() inPlaceSearch: boolean;
  @Input() appliedFilter: AppliedFilter;
  searchLink: string;
  removeParameters$: Observable<Params>;

  /**
   * Initialize the instance variable
   */
  constructor(
    protected paginationService: PaginationService,
    protected router: Router,
    protected searchConfigurationService: SearchConfigurationService,
    protected searchService: SearchService,
    protected searchFilterService: SearchFilterService,
  ) {
  }

  ngOnInit(): void {
    this.searchLink = this.getSearchLink();
    this.removeParameters$ = this.updateRemoveParams();
  }

  /**
   * Calculates the parameters that should change if this {@link appliedFilter} would be removed from the active filters
   */
  updateRemoveParams(): Observable<Params> {
    return this.searchConfigurationService.unselectAppliedFilterParams(this.appliedFilter.filter, this.appliedFilter.value, this.appliedFilter.operator);
  }

  /**
   * @returns {string} The base path to the search page, or the current page when inPlaceSearch is true
   */
  getSearchLink(): string {
    if (this.inPlaceSearch) {
      return currentPath(this.router);
    }
    return this.searchService.getSearchLink();
  }

}
