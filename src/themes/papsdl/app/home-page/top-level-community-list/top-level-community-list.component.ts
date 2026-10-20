import {
  AsyncPipe, NgForOf,
  NgIf,
} from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  APP_CONFIG,
  AppConfig,
} from 'src/config/app-config.interface';

import { CommunityDataService } from '../../../../../app/core/data/community-data.service';
import { PaginationService } from '../../../../../app/core/pagination/pagination.service';
import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { ObjectCollectionComponent } from '../../../../../app/shared/object-collection/object-collection.component';
import { VarDirective } from '../../../../../app/shared/utils/var.directive';
import { RouterLink } from '@angular/router';
import {RemoteData} from "../../../../../app/core/data/remote-data";
import {PaginatedList} from "../../../../../app/core/data/paginated-list.model";
import {Community} from "../../../../../app/core/shared/community.model";

interface FetchedCommunity {
  name: string;
  uuid: string;
  itemsCount: number;
  logo: string;
}

@Component({
  selector: 'ds-themed-top-level-community-list',
  styleUrls: ['../../../../../app/home-page/top-level-community-list/top-level-community-list.component.scss'],
  templateUrl: './top-level-community-list.component.html',
  standalone: true,
  imports: [VarDirective, NgIf, ObjectCollectionComponent, ErrorComponent, ThemedLoadingComponent, AsyncPipe, TranslateModule, RouterLink, NgForOf],
})

export class TopLevelCommunityListComponent extends BaseComponent implements OnInit {
  communitiesFetched:  FetchedCommunity[] = [];
  constructor(@Inject(APP_CONFIG) protected appConfig: AppConfig,
    communityDataService: CommunityDataService,
    paginationService: PaginationService) {
    super(appConfig, communityDataService, paginationService);
  }

  ngOnInit() {
    super.ngOnInit();
    const featuredCommunities = {
      'a2fabeb6-1288-4a15-89bf-afa40f0016ce': 1,
      '771f5808-98ae-474e-b743-e50be72f5f41': 2,
      '9d0513e5-e883-4131-913a-a8b478686bdd': 3,
      '74ce45f5-1a7d-4105-acdb-b43ec4a01a09': 4,
      'f3d5f8e9-6cf3-4d56-b7d7-0aa5e33a4456': 5,
    };
    this.communitiesRD$.subscribe((rsp: RemoteData<PaginatedList<Community>>) => {
      if (rsp.hasCompleted && rsp.payload) {

        // Step 1: Get only the communities that exist in featuredCommunities
        const filteredCommunities = rsp.payload.page.filter((community) => {
          return featuredCommunities.hasOwnProperty(community.uuid);
        });

        // Step 2: Convert the filtered communities into the desired format
        const mappedCommunities = filteredCommunities.map((community) => {
          return {
            name: community.name,
            uuid: community.uuid,
            logo: community.uuid,
            itemsCount: community.archivedItemsCount > 0 ? community.archivedItemsCount : 0,
          };
        });

        // Step 3: Sort the communities based on the order in featuredCommunities
        const sortedCommunities = mappedCommunities.sort((a, b) => {
          return featuredCommunities[a.uuid] - featuredCommunities[b.uuid];
        });

        // Step 4: Assign the final sorted list to communitiesFetched
        this.communitiesFetched = sortedCommunities;
      }
    });
  }
}
