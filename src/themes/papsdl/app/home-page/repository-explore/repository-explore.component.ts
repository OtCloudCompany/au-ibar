import {
  Component,
  OnInit,
} from '@angular/core';
import {
  NgIf,
} from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import {
  SortDirection,
  SortOptions,
} from '../../../../../app/core/cache/models/sort-options.model';
import { PaginatedList } from '../../../../../app/core/data/paginated-list.model';
import { RemoteData } from '../../../../../app/core/data/remote-data';
import { PaginationComponentOptions } from '../../../../../app/core/pagination/pagination-component-options.model';
import { DSpaceObjectType } from '../../../../../app/core/shared/dspace-object-type.model';
import { Item } from '../../../../../app/core/shared/item.model';
import { toDSpaceObjectListRD } from '../../../../../app/core/shared/operators';
import { PaginatedSearchOptions } from '../../../../../app/core/shared/search/models/paginated-search-options.model';
import { SearchService } from '../../../../../app/shared/search/search.service';

@Component({
  selector: 'ds-paps-repository-explore',
  standalone: true,
  templateUrl: './repository-explore.component.html',
  styleUrls: ['./repository-explore.component.scss'],
  imports: [
    NgIf,
    RouterLink,
  ],
})
export class RepositoryExploreComponent implements OnInit {

  latestPPoW?: Item;
  ppowLoading = true;

  private ppowPagination: PaginationComponentOptions;

  constructor(
    private searchService: SearchService,
  ) {
    this.ppowPagination = Object.assign(
      new PaginationComponentOptions(),
      {
        id: 'paps-latest-ppow',
        pageSize: 100,
        currentPage: 1,
        maxSize: 1,
      },
    );
  }

  ngOnInit(): void {
    this.loadLatestPPoW();
  }

  private loadLatestPPoW(): void {

    const result$ = this.searchService.search(
      new PaginatedSearchOptions({
        pagination: this.ppowPagination,
        dsoTypes: [DSpaceObjectType.ITEM],
        sort: new SortOptions(
          'dc.date.issued',
          SortDirection.DESC,
        ),
      }),
    ).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>;

    result$.subscribe((rd) => {

      if (!rd?.hasSucceeded || !rd?.payload?.page) {
        return;
      }

      this.latestPPoW = rd.payload.page.find((item) => {

        const subjects = (
          item.metadata['dc.subject'] || []
        ).map((entry) =>
          entry.value?.trim().toLowerCase(),
        );

        return subjects.includes('ppow');
      });

      this.ppowLoading = false;
    });
  }

  getTitle(item: Item): string {
    return item.metadata['dc.title']?.[0]?.value ||
      'Provisional Programme of Work';
  }

  getReference(item: Item): string {
    return (
      item.metadata['aupaps.identifier.reference']?.[0]?.value ||
      item.metadata['dc.identifier.other']?.[0]?.value ||
      ''
    );
  }

  getDate(item: Item): string {
    const value =
      item.metadata['dc.date.issued']?.[0]?.value;

    if (!value) {
      return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric',
        });
  }

  getItemUrl(item: Item): string {
    return `/items/${item.uuid}`;
  }
}
