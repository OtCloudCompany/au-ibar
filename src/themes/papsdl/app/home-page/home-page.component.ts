import {
  AsyncPipe,
  NgIf,
  NgTemplateOutlet,
} from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeCoarComponent } from '../../../../app/home-page/home-coar/home-coar.component';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';

import { HeroSliderComponent } from './hero-slider/hero-slider.component';
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
    SuggestionsPopupComponent,
    HeroSliderComponent,
    EditorialStripComponent,
    DocumentTypesComponent,
    Fishgov2SpotlightComponent,
  ],
})
export class HomePageComponent extends BaseComponent {
}
