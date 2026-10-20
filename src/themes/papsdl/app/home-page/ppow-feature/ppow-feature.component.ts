import {
  isPlatformBrowser,
  NgFor,
  NgIf,
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
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

interface FocusArea {
  label: string;
  searchValue: string;
  count: number;
  firstSeen: number;
}

@Component({
  selector: 'ds-paps-ppow-feature',
  standalone: true,
  templateUrl: './ppow-feature.component.html',
  styleUrls: ['./ppow-feature.component.scss'],
  imports: [
    NgFor,
    NgIf,
  ],
})
export class PpowFeatureComponent implements OnInit {

  latestPPoW?: Item;

  focusAreas: FocusArea[] = [];
  focusHeading = 'Focus Areas This Month';

  ppowLoading = true;
  ppowFailed = false;

  private ppowPagination: PaginationComponentOptions;
  private focusPagination: PaginationComponentOptions;

  private readonly excludedFocusSubjects = new Set([
    'ppow',
    'provisional programme of work',
    'peace and security council',
    'peace and security',
  ]);

  constructor(
    private searchService: SearchService,
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef,
  ) {
    this.ppowPagination = Object.assign(
      new PaginationComponentOptions(),
      {
        id: 'paps-feature-latest-ppow',
        pageSize: 1,
        currentPage: 1,
        maxSize: 1,
      },
    );

    this.focusPagination = Object.assign(
      new PaginationComponentOptions(),
      {
        id: 'paps-ppow-month-focus',
        pageSize: 100,
        currentPage: 1,
        maxSize: 100,
      },
    );
  }

  ngOnInit(): void {
    this.loadLatestPPoW();

    if (isPlatformBrowser(this.platformId)) {
      this.loadBrowserFocusAreas();
    }
  }

  private async loadBrowserFocusAreas(): Promise<void> {
    try {

      const ppowParams = new URLSearchParams({
        query: 'dc.subject:"PPoW"',
        dsoType: 'item',
        sort: 'dc.date.issued,DESC',
        size: '1',
      });

      const ppowResponse = await fetch(
        `/server/api/discover/search/objects?${ppowParams.toString()}`,
        {
          headers: {
            Accept: 'application/hal+json',
          },
        },
      );

      if (!ppowResponse.ok) {
        throw new Error(
          `PPoW lookup returned HTTP ${ppowResponse.status}`,
        );
      }

      const ppowData = await ppowResponse.json();

      const ppowItem =
        ppowData?._embedded
          ?.searchResult
          ?._embedded
          ?.objects?.[0]
          ?._embedded
          ?.indexableObject as Item | undefined;

      if (!ppowItem) {
        return;
      }

      await this.loadMonthlyFocusAreas(ppowItem);

    } catch (error) {
      console.warn(
        'Unable to determine PPoW month for focus areas.',
        error,
      );
    }
  }

  private loadLatestPPoW(): void {
    this.ppowLoading = true;
    this.ppowFailed = false;

    const result$ = this.searchService.search(
      new PaginatedSearchOptions({
        pagination: this.ppowPagination,
        dsoTypes: [DSpaceObjectType.ITEM],
        query: 'dc.subject:"PPoW"',
        sort: new SortOptions(
          'dc.date.issued',
          SortDirection.DESC,
        ),
      }),
    ).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>;

    result$.subscribe((rd) => {

      if (rd?.hasFailed) {
        this.ppowFailed = true;
        this.ppowLoading = false;
        return;
      }

      if (!rd?.hasSucceeded) {
        return;
      }

      this.latestPPoW =
        rd.payload?.page?.length
          ? rd.payload.page[0]
          : undefined;

      this.ppowLoading = false;

    });
  }

  /**
   * Find all recently indexed records issued in the same YYYY-MM
   * as the currently displayed Programme of Work, then aggregate
   * their dc.subject values.
   */
  private async loadMonthlyFocusAreas(ppow: Item): Promise<void> {

    /*
     * The PPoW itself can be rendered during SSR, but the secondary
     * monthly subject aggregation is deliberately browser-only.
     * This avoids SSR host/transfer-state issues affecting this
     * lightweight editorial enhancement.
     */
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentMonthKey = this.getMonthKey(ppow);

    if (!currentMonthKey) {
      this.focusAreas = [];
      return;
    }

    try {

      const params = new URLSearchParams({
        query: '*',
        dsoType: 'item',
        sort: 'dc.date.issued,DESC',
        size: '100',
      });

      const response = await fetch(
        `/server/api/discover/search/objects?${params.toString()}`,
        {
          headers: {
            Accept: 'application/hal+json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Focus-area search returned HTTP ${response.status}`,
        );
      }

      const data = await response.json();

      const objects =
        data?._embedded
          ?.searchResult
          ?._embedded
          ?.objects || [];

      const items: Item[] = objects
        .map((result: any) =>
          result?._embedded?.indexableObject,
        )
        .filter((item: Item | undefined) => !!item);

      /*
       * First try the month represented by the current PPoW.
       */
      let targetMonth = currentMonthKey;

      let monthlyItems = items.filter((item) => {
        const issued =
          item.metadata['dc.date.issued']?.[0]?.value || '';

        return issued.startsWith(targetMonth);
      });

      let focusAreas =
        this.buildFocusAreas(monthlyItems);

      /*
       * If that month only contains the PPoW and therefore has
       * no meaningful focus subjects, use the latest previous
       * month containing substantive subject metadata.
       */
      if (!focusAreas.length) {

        const availableMonths = Array.from(
          new Set(
            items
              .map((item) => this.getMonthKey(item))
              .filter((month) =>
                !!month && month < currentMonthKey,
              ),
          ),
        ).sort().reverse();

        for (const month of availableMonths) {

          const candidateItems =
            items.filter((item) => {

              const issued =
                item.metadata['dc.date.issued']?.[0]?.value || '';

              return issued.startsWith(month);
            });

          const candidateFocus =
            this.buildFocusAreas(candidateItems);

          if (candidateFocus.length) {
            targetMonth = month;
            focusAreas = candidateFocus;
            break;
          }
        }
      }

      this.focusAreas =
        focusAreas.slice(0, 6);

      this.focusHeading =
        targetMonth === currentMonthKey
          ? 'Focus Areas This Month'
          : `${this.formatMonthKey(targetMonth)} Focus Areas`;

      this.cdr.detectChanges();

    } catch (error) {

      console.warn(
        'Unable to load PPoW monthly focus areas.',
        error,
      );

      this.focusAreas = [];
      this.cdr.detectChanges();
    }
  }

  /**
   * Aggregate subjects case-insensitively.
   *
   * Ranking:
   * 1. subjects appearing on the greatest number of items
   * 2. subjects appearing in the newest items
   * 3. alphabetical as a final deterministic tie-breaker
   */
  private buildFocusAreas(items: Item[]): FocusArea[] {
    const subjectMap = new Map<string, FocusArea>();

    items.forEach((item, itemIndex) => {

      const subjects =
        item.metadata['dc.subject'] || [];

      subjects.forEach((entry) => {

        const original = entry.value?.trim();

        if (!original) {
          return;
        }

        /*
         * Remove cosmetic final punctuation for display/comparison
         * while preserving the actual metadata value for the search URL.
         */
        const display =
          original.replace(/[.;:,]+$/, '').trim();

        const key =
          display
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        if (
          !key ||
          this.excludedFocusSubjects.has(key)
        ) {
          return;
        }

        const existing = subjectMap.get(key);

        if (existing) {
          existing.count += 1;

          if (itemIndex < existing.firstSeen) {
            existing.firstSeen = itemIndex;
          }

          return;
        }

        subjectMap.set(key, {
          label: display,
          searchValue: original,
          count: 1,
          firstSeen: itemIndex,
        });
      });
    });

    return Array.from(subjectMap.values())
      .sort((a, b) => {

        if (b.count !== a.count) {
          return b.count - a.count;
        }

        if (a.firstSeen !== b.firstSeen) {
          return a.firstSeen - b.firstSeen;
        }

        return a.label.localeCompare(b.label);
      });
  }

  private getMonthKey(item: Item): string {
    const value =
      item.metadata['dc.date.issued']?.[0]?.value || '';

    const match =
      value.match(/^(\d{4})-(\d{2})/);

    return match
      ? `${match[1]}-${match[2]}`
      : '';
  }

  private formatMonthKey(monthKey: string): string {
    const match =
      monthKey.match(/^(\d{4})-(\d{2})$/);

    if (!match) {
      return 'Recent';
    }

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      1,
    );

    return date.toLocaleDateString(
      'en-GB',
      {
        month: 'long',
      },
    );
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

  getMonth(item: Item): string {
    const value =
      item.metadata['dc.date.issued']?.[0]?.value;

    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date
      .toLocaleDateString('en-GB', {
        month: 'short',
      })
      .toUpperCase();
  }

  getYear(item: Item): string {
    const value =
      item.metadata['dc.date.issued']?.[0]?.value;

    if (!value) {
      return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ''
      : String(date.getFullYear());
  }

  getItemUrl(item: Item): string {
    return `/items/${item.uuid}`;
  }

  getFocusAreaUrl(area: FocusArea): string {
    return (
      '/search?f.subject=' +
      encodeURIComponent(area.searchValue) +
      ',equals&spc.page=1'
    );
  }
}
