import {
  AsyncPipe,
  NgForOf,
  NgIf,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  NgbCarousel,
  NgbCarouselModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
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
import { SearchService } from '../../../../../app/shared/search/search.service';
import { SearchConfigurationService } from '../../../../../app/shared/search/search-configuration.service';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { PaginationComponentOptions } from '../../../../../app/core/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../../../../app/core/shared/search/models/paginated-search-options.model';

import {
  FollowLinkConfig,
  followLink,
} from '../../../../../app/core/shared/follow-link-config.model';
import {
  APP_CONFIG,
  AppConfig,
} from '../../../../../config/app-config.interface';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'ds-recent-submissions',
  standalone: true,
  imports: [
    ErrorComponent,
    NgIf,
    ThemedLoadingComponent,
    TranslateModule,
    NgbCarouselModule,
    NgForOf,
    AsyncPipe,
  ],
  templateUrl: './recent-submissions.component.html',
  styleUrl: './recent-submissions.component.scss',
})
export class RecentSubmissionsComponent implements OnDestroy, OnInit, AfterViewInit {
  paginationConfig: PaginationComponentOptions;
  sortConfig: SortOptions;
  itemRD$: Observable<RemoteData<PaginatedList<Item>>>;
  itemRD: RemoteData<PaginatedList<Item>>;
  itemsLoaded = false;
  items: Item[][] = [];
  chunks$: BehaviorSubject<Item[][]> = new BehaviorSubject<Item[][]>([]);
  @ViewChild('recentSubmissionsCarousel', { static: false }) carouselElement!: ElementRef;
  @ViewChild('carousel', { static: false }) carousel!: NgbCarousel;

  constructor(
    private searchService: SearchService,
    private bitstreamService: BitstreamDataService,
    private paginationService: PaginationService,
    public searchConfigurationService: SearchConfigurationService,
    protected changeDetector: ChangeDetectorRef,
    @Inject(APP_CONFIG) private appConfig: AppConfig,
  ) {
    this.paginationConfig = Object.assign(new PaginationComponentOptions(), {
      id: 'hp',
      pageSize: environment.homePage.recentSubmissions.pageSize,
      currentPage: 1,
      maxSize: 1,
    });
    this.sortConfig = new SortOptions(environment.homePage.recentSubmissions.sortField, SortDirection.DESC);
  }

  ngOnInit(): void {
    const linksToFollow: FollowLinkConfig<Item>[] = [];
    if (this.appConfig.browseBy.showThumbnails) {
      linksToFollow.push(followLink('thumbnail'));
    }
    if (this.appConfig.item.showAccessStatuses) {
      linksToFollow.push(followLink('accessStatus'));
    }

    this.itemRD$ = this.searchService.search(
      new PaginatedSearchOptions({
        pagination: this.paginationConfig,
        dsoTypes: [DSpaceObjectType.ITEM],
        sort: new SortOptions('dc.date.issued', SortDirection.DESC),
      }),
      undefined,
      undefined,
      undefined,
      ...linksToFollow,
    ).pipe(toDSpaceObjectListRD()) as Observable<RemoteData<PaginatedList<Item>>>;

    this.itemRD$.subscribe(itemsRD => {
      this.itemRD = itemsRD;
      if (itemsRD?.hasSucceeded && itemsRD?.payload?.page.length > 0) {
        this.itemsLoaded = true;
        this.chunks$.next(this.chunkArray(itemsRD.payload.page, 4));
        this.changeDetector.detectChanges();
      }
    });
  }
  ngAfterViewInit() {
    this.chunks$.subscribe(() => {
      this.changeDetector.detectChanges(); // Ensure UI updates
      setTimeout(() => this.carousel?.cycle(), 500); // Restart carousel if needed
    });
  }

  ngOnDestroy(): void {
    this.paginationService.clearPagination('hp');
  }

  private chunkArray(array: Item[], chunkSize: number): Item[][] {
    const result: Item[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }

  getThumbnail(item: Item): Observable<string> {
    if (!item._links.thumbnail) {
      return of('assets/papsdl/images/default-thumbnail.jpg');
    }

    return this.bitstreamService.findByHref(item._links.thumbnail.href).pipe(
      map((bitstream) =>
        bitstream?.payload?.bundleName === 'THUMBNAIL'
          ? bitstream.payload._links.content.href
          : 'assets/papsdl/images/default-thumbnail.jpg',
      ),
      catchError(() => of('assets/papsdl/images/default-thumbnail.jpg')),
    );
  }

  getItemUrl(item: Item): string {
    return `/items/${item.uuid}`;
  }
  getTitle(item: Item): string {
    const title = item.metadata['dc.title']?.[0]?.value || 'No Title';
    return title.length > 80 ? title.substring(0, 80) + '...' : title;
  }
}

