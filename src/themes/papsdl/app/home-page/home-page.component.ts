import {
  AsyncPipe,
  NgIf,
  NgTemplateOutlet,
} from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeCoarComponent } from '../../../../app/home-page/home-coar/home-coar.component';
import { ThemedHomeNewsComponent } from '../../../../app/home-page/home-news/themed-home-news.component';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { RecentItemListComponent } from '../../../../app/home-page/recent-item-list/recent-item-list.component';
import { ThemedTopLevelCommunityListComponent } from '../../../../app/home-page/top-level-community-list/themed-top-level-community-list.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';
import { ThemedConfigurationSearchPageComponent } from '../../../../app/search-page/themed-configuration-search-page.component';

import { CustomSidebarComponent } from './custom-sidebar/custom-sidebar.component';
import { HeroSliderComponent } from './hero-slider/hero-slider.component';
import { UpcomingEventsComponent } from './upcoming-events/upcoming-events.component';
import { EditorialStripComponent } from './editorial-strip/editorial-strip.component';
import { DocumentTypesComponent } from './document-types/document-types.component';
import { Fishgov2SpotlightComponent } from './fishgov2-spotlight/fishgov2-spotlight.component';

@Component({
  selector: 'ds-themed-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    NgTemplateOutlet,
    TranslateModule,
    HomeCoarComponent,
    ThemedHomeNewsComponent,
    RecentItemListComponent,
    ThemedTopLevelCommunityListComponent,
    SuggestionsPopupComponent,
    ThemedConfigurationSearchPageComponent,
    CustomSidebarComponent,
    HeroSliderComponent,
    UpcomingEventsComponent,
    EditorialStripComponent,
    DocumentTypesComponent,
    Fishgov2SpotlightComponent,
  ],
})
export class HomePageComponent extends BaseComponent {
}
