import {
  AsyncPipe,
  NgFor,
  NgIf,
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  forkJoin,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
} from 'rxjs/operators';

import {
  SortDirection,
  SortOptions,
} from '../../../../../app/core/cache/models/sort-options.model';
import { BitstreamDataService } from '../../../../../app/core/data/bitstream-data.service';
import { PaginatedList } from '../../../../../app/core/data/paginated-list.model';
import { RemoteData } from '../../../../../app/core/data/remote-data';
import { PaginationService } from '../../../../../app/core/pagination/pagination.service';
import { DSpaceObjectType } from '../../../../../app/core/shared/dspace-object-type.model';
import { Item } from '../../../../../app/core/shared/item.model';
import { toDSpaceObjectListRD } from '../../../../../app/core/shared/operators';
import { PaginationComponentOptions } from '../../../../../app/core/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../../../../app/core/shared/search/models/paginated-search-options.model';
import { UsageReport } from '../../../../../app/core/statistics/models/usage-report.model';
import { UsageReportDataService } from '../../../../../app/core/statistics/usage-report-data.service';
import { SearchService } from '../../../../../app/shared/search/search.service';





interface MostViewedItem {
  item: Item;
  views: number;
}

interface ThematicArea {
  title: string;
  terms: string[];
  fallbackImage: string;
}

interface ThematicFeature {
  theme: ThematicArea;
  item: Item;
  thumbnail$: Observable<string>;
}

@Component({
  selector: 'ds-paps-editorial-strip',
  standalone: true,
  templateUrl: './editorial-strip.component.html',
  styleUrls: ['./editorial-strip.component.scss'],
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
  ],
})
export class EditorialStripComponent implements OnInit, OnDestroy {

  readonly documentPlaceholder =
    'assets/papsdl/images/auibar-document-placeholder.svg';

  handleThumbnailError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }

    image.dataset['fallbackApplied'] = 'true';
    image.src = this.documentPlaceholder;
  }



  latestRD$: Observable<RemoteData<PaginatedList<Item>>>;
  latestRD: RemoteData<PaginatedList<Item>>;
  latestItems: Item[] = [];

  mostViewedItems: MostViewedItem[] = [];
  mostViewedLoading = true;
  mostViewedFailed = false;

  featuredThematicItems: ThematicFeature[] = [];
  thematicLoading = true;
  thematicFailed = false;

  latestPaginationConfig: PaginationComponentOptions;
  mostViewedCandidatePaginationConfig: PaginationComponentOptions;
  thematicPaginationConfig: PaginationComponentOptions;

  readonly thematicAreas: ThematicArea[] = [
    {
      title: 'Conflict Prevention & Mediation',
      terms: [
        'Conflict Prevention',
        'Mediation',
        'Youth in Mediation',
        'Panel of the Wise',
        'Preventive Diplomacy',
        'Early Warning',
        'Political Agreement',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-21.webp',
    },
    {
      title: 'Peacebuilding & PCRD',
      terms: [
        'Post-Conflict Reconstruction and Development (PCRD)',
        'Peacebuilding',
        'Peacekeeping and Peacebuilding',
        'Reconstruction',
        'Reconciliation',
        'Stabilization',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-31.webp',
    },
    {
      title: 'Governance & Constitutional Order',
      terms: [
        'Unconstitutional Change of Government',
        'Political Transition',
        'Elections in Africa',
        'Democracy',
        'Rule of Law',
        'Human Rights',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-11.webp',
    },
    {
      title: 'Terrorism & Transnational Threats',
      terms: [
        'Terrorism and Violent Extremism',
        'Boko Haram',
        'Terrorist Group',
        'Money Laundering',
        'Illicit Financial Flows',
        'Organized Crime',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-41.webp',
    },
    {
      title: 'Women, Youth & Children',
      terms: [
        'Women, Peace and Security',
        'Youth in Mediation',
        'Youth, Peace and Security',
        'Children in Armed Conflict',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-11.webp',
    },
    {
      title: 'Humanitarian Affairs & Protection',
      terms: [
        'Humanitarian Action',
        'Humanitarian Crisis',
        'Refugees',
        'Internally Displaced Persons',
        'IDPs',
        'Protection of Civilians',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-21.webp',
    },
    {
      title: 'Climate, Environment & Natural Resources',
      terms: [
        'Climate Security',
        'Climate Change',
        'Climate-Security Nexus',
        'Natural Resources',
        'Natural Resource Governance',
        'Resource Conflict',
        'Environmental Security',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-31.webp',
    },
    {
      title: 'Arms Control & Disarmament',
      terms: [
        'Small Arms and Light Weapons',
        'Disarmament',
        'Arms Control',
        'Illicit Weapons',
        'Illicit Proliferation',
        'Mine Action',
        'Landmines',
        'Africa Amnesty Month',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-41.webp',
    },
    {
      title: 'Peace Support Operations',
      terms: [
        'Peace Support Operation',
        'African Standby Force (ASF)',
        'African Union Mission in Somalia (AMISOM)',
        'Peacekeeping',
        'Peace Fund',
        'Multinational Joint Task Force (MNJTF)',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-31.webp',
    },
    {
      title: 'Strategic Partnerships & Multilateral P&S',
      terms: [
        'AU-UN',
        'A3',
        'Partnership',
        'United Nations Peace Building Commission (UNPBC)',
        'Southern African Development Community (SADC)',
        'Regional Instruments',
      ],
      fallbackImage: 'assets/papsdl/images/news/au-11.webp',
    },
  ];

  constructor(
    private searchService: SearchService,
    private paginationService: PaginationService,
    private usageReportService: UsageReportDataService,
    private bitstreamService: BitstreamDataService,
    private changeDetector: ChangeDetectorRef,
  ) {

    this.latestPaginationConfig = Object.assign(
      new PaginationComponentOptions(),
      {
        id: 'paps-editorial-latest',
        pageSize: 12,
        currentPage: 1,
        maxSize: 1,
      },
    );

    this.mostViewedCandidatePaginationConfig = Object.assign(
      new PaginationComponentOptions(),
      {
        id: 'paps-editorial-most-viewed',
        pageSize: 20,
        currentPage: 1,
        maxSize: 1,
      },
    );

    this.thematicPaginationConfig = Object.assign(
      new PaginationComponentOptions(),
      {
        id: 'paps-editorial-thematic',
        pageSize: 50,
        currentPage: 1,
        maxSize: 1,
      },
    );
  }

  ngOnInit(): void {
    this.loadLatestItems();
  }

  ngOnDestroy(): void {
    this.paginationService.clearPagination('paps-editorial-latest');
    this.paginationService.clearPagination('paps-editorial-most-viewed');
    this.paginationService.clearPagination('paps-editorial-thematic');
  }

  private loadLatestItems(): void {
    this.latestRD$ = this.searchService.search(
      new PaginatedSearchOptions({
        pagination: this.latestPaginationConfig,
        dsoTypes: [DSpaceObjectType.ITEM],
        sort: new SortOptions('dc.date.issued', SortDirection.DESC),
      }),
    ).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>;

    this.latestRD$.subscribe((rd) => {
      this.latestRD = rd;

      if (rd?.hasSucceeded && rd?.payload?.page) {
        this.latestItems = rd.payload.page;
        this.changeDetector.detectChanges();
      }
    });
  }

  private loadMostViewedItems(): void {
    this.mostViewedLoading = true;
    this.mostViewedFailed = false;

    const candidates$ = this.searchService.search(
      new PaginatedSearchOptions({
        pagination: this.mostViewedCandidatePaginationConfig,
        dsoTypes: [DSpaceObjectType.ITEM],
        sort: new SortOptions('dc.date.issued', SortDirection.DESC),
      }),
    ).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>;

    candidates$.subscribe((rd) => {
      if (rd?.hasFailed) {
        this.mostViewedLoading = false;
        this.mostViewedFailed = true;
        this.changeDetector.detectChanges();
        return;
      }

      if (!rd?.hasSucceeded || !rd?.payload?.page?.length) {
        return;
      }

      const statisticsRequests = rd.payload.page.map((item) =>
        this.usageReportService
          .getStatistic(item.id, 'TotalVisits')
          .pipe(
            map((report: UsageReport) => ({
              item,
              views: this.getViewCount(report),
            })),
            catchError(() =>
              of({
                item,
                views: 0,
              }),
            ),
          ),
      );

      forkJoin(statisticsRequests).subscribe({
        next: (results) => {
          this.mostViewedItems = results
            .sort((a, b) => b.views - a.views)
            .slice(0, 4);

          this.mostViewedLoading = false;
          this.changeDetector.detectChanges();
        },
        error: () => {
          this.mostViewedLoading = false;
          this.mostViewedFailed = true;
          this.changeDetector.detectChanges();
        },
      });
    });
  }

  private loadThematicItems(): void {
    this.thematicLoading = true;
    this.thematicFailed = false;

    const thematic$ = this.searchService.search(
      new PaginatedSearchOptions({
        pagination: this.thematicPaginationConfig,
        dsoTypes: [DSpaceObjectType.ITEM],
        sort: new SortOptions('dc.date.issued', SortDirection.DESC),
      }),
    ).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>;

    thematic$.subscribe((rd) => {
      if (rd?.hasFailed) {
        this.thematicLoading = false;
        this.thematicFailed = true;
        this.changeDetector.detectChanges();
        return;
      }

      if (!rd?.hasSucceeded || !rd?.payload?.page?.length) {
        return;
      }

      const items = rd.payload.page;

      const matches: ThematicFeature[] = [];

      for (const theme of this.thematicAreas) {
        const item = items.find((candidate) =>
          this.matchesTheme(candidate, theme),
        );

        if (item) {
          matches.push({
            theme,
            item,
            thumbnail$: this.resolveThemeThumbnail(item, theme),
          });
        }
      }

      matches.sort(
        (a, b) =>
          this.getDateTimestamp(b.item) -
          this.getDateTimestamp(a.item),
      );

      const usedItems = new Set<string>();
      const selected: ThematicFeature[] = [];

      for (const match of matches) {
        if (usedItems.has(match.item.uuid)) {
          continue;
        }

        usedItems.add(match.item.uuid);
        selected.push(match);

        if (selected.length === 4) {
          break;
        }
      }

      this.featuredThematicItems = selected;
      this.thematicLoading = false;
      this.changeDetector.detectChanges();
    });
  }

  private matchesTheme(item: Item, theme: ThematicArea): boolean {
    const subjects = (
      item.metadata['dc.subject'] || []
    )
      .map((entry) => entry.value?.trim().toLowerCase())
      .filter(Boolean);

    const scopeThemes = (
      item.metadata['aupaps.scope.theme'] || []
    )
      .map((entry) => entry.value?.trim().toLowerCase())
      .filter(Boolean);

    const title =
      item.metadata['dc.title']?.[0]?.value?.toLowerCase() || '';

    const terms = theme.terms.map((term) =>
      term.toLowerCase(),
    );

    // 1. Strongest signal: subject metadata
    const subjectMatch = terms.some((term) =>
      subjects.some((subject) =>
        subject === term ||
        subject.includes(term) ||
        term.includes(subject),
      ),
    );

    if (subjectMatch) {
      return true;
    }

    // 2. Explicit thematic metadata
    const scopeMatch = terms.some((term) =>
      scopeThemes.some((scopeTheme) =>
        scopeTheme === term ||
        scopeTheme.includes(term) ||
        term.includes(scopeTheme),
      ),
    );

    if (scopeMatch) {
      return true;
    }

    // 3. Title fallback only for distinctive multi-word expressions.
    const titleTerms = terms.filter((term) =>
      term.includes(' ') && term.length >= 12,
    );

    return titleTerms.some((term) =>
      title.includes(term),
    );
  }


  private getDateTimestamp(item: Item): number {
    const value =
      item.metadata['dc.date.issued']?.[0]?.value;

    if (!value) {
      return 0;
    }

    const time = Date.parse(value);

    return Number.isNaN(time) ? 0 : time;
  }

  private getViewCount(report: UsageReport): number {
    if (!report?.points?.length) {
      return 0;
    }

    return report.points.reduce((total, point) => {
      const values =
        point.values as unknown as { views?: number };

      return total + (values?.views || 0);
    }, 0);
  }

  private resolveThemeThumbnail(
    item: Item,
    theme: ThematicArea,
  ): Observable<string> {
    const fallback = theme.fallbackImage;

    if (!item._links?.thumbnail) {
      return of(fallback);
    }

    return this.bitstreamService
      .findByHref(item._links.thumbnail.href)
      .pipe(
        map((bitstream) =>
          bitstream?.payload?._links?.content?.href
            ? bitstream.payload._links.content.href
            : fallback,
        ),
        catchError(() => of(fallback)),
      );
  }


  onThemeImageError(event: Event, feature: ThematicFeature): void {
    const img = event.target as HTMLImageElement;

    if (!img) {
      return;
    }

    const fallback = feature.theme.fallbackImage;

    if (!img.src.includes(fallback)) {
      img.src = fallback;
    }
  }

  private readonly latestThumbnailCache =
    new Map<string, Observable<string | null>>();

  getLatestThumbnail(item: Item): Observable<string | null> {
    const cached = this.latestThumbnailCache.get(item.uuid);

    if (cached) {
      return cached;
    }

    let thumbnail$: Observable<string | null>;

    if (!item._links?.thumbnail) {
      thumbnail$ = of(null);
    } else {
      thumbnail$ = this.bitstreamService
        .findByHref(item._links.thumbnail.href)
        .pipe(
          map((bitstream) =>
            bitstream?.payload?._links?.content?.href || null
          ),
          catchError(() => of(null)),
        );
    }

    this.latestThumbnailCache.set(item.uuid, thumbnail$);

    return thumbnail$;
  }

  getAbstract(item: Item): string {
    return (
      item.metadata['dc.description.abstract']?.[0]?.value?.trim()
      || ''
    );
  }


  getTitle(item: Item): string {
    return (
      item.metadata['dc.title']?.[0]?.value ||
      'Untitled document'
    );
  }

  getDate(item: Item): string {
    const value =
      item.metadata['dc.date.issued']?.[0]?.value;

    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getReference(item: Item): string {
    return (
      item.metadata['aupaps.identifier.reference']?.[0]?.value ||
      item.metadata['dc.identifier.other']?.[0]?.value ||
      ''
    );
  }



  latestCarouselIndex = 0;

  get latestCarouselItems(): Item[] {
    if (!this.latestItems?.length) {
      return [];
    }

    const visible = Math.min(6, this.latestItems.length);
    const items: Item[] = [];

    for (let i = 0; i < visible; i++) {
      items.push(
        this.latestItems[
          (this.latestCarouselIndex + i) % this.latestItems.length
        ],
      );
    }

    return items;
  }

  previousLatestDocument(): void {
    if (!this.latestItems?.length) {
      return;
    }

    this.latestCarouselIndex =
      (
        this.latestCarouselIndex -
        1 +
        this.latestItems.length
      ) % this.latestItems.length;
  }

  nextLatestDocument(): void {
    if (!this.latestItems?.length) {
      return;
    }

    this.latestCarouselIndex =
      (this.latestCarouselIndex + 1) %
      this.latestItems.length;
  }


  getItemUrl(item: Item): string {
    return `/items/${item.uuid}`;
  }
}
