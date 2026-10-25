import {
  DecimalPipe,
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
import { RouterLink } from '@angular/router';
import {
  APP_CONFIG,
  AppConfig,
} from '@dspace/config/app-config.interface';

import {
  browseRouteFor,
  countFiltered,
  HomeCard,
  iconFor,
  readCache,
  topEntries,
  writeCache,
} from '../shared/vocabulary-home';

/** Vocabulary of AU-IBAR subject headings; Discovery filters on dc.subject.auibar (see discovery.xml). */
const VOCABULARY = 'auibar-subjects';
const THEME_FILTER = 'auibartheme';
const SHOWN = 6;

/**
 * AU-IBAR (25 Oct 2026): "Browse by Thematic Areas" built from the top level of the AU-IBAR subject-heading
 * vocabulary. Each card counts the items whose heading falls under the theme and links to those items;
 * the five largest themes are shown, with a link to the full subject-heading browse.
 */
@Component({
  selector: 'ds-auibar-thematic-areas',
  standalone: true,
  imports: [DecimalPipe, NgFor, NgIf, RouterLink],
  templateUrl: './thematic-areas.component.html',
  styleUrls: ['./thematic-areas.component.scss'],
})
export class ThematicAreasComponent implements OnInit {
  themes: HomeCard[] = [];
  total = 0;
  allRoute: string | null = null;
  loaded = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      void this.load();
    }
  }

  private async load(): Promise<void> {
    const cached = readCache<{ themes: HomeCard[]; total: number; allRoute: string | null }>('themes');
    if (cached) {
      Object.assign(this, cached);
      this.loaded = true;
      this.cdr.detectChanges();
    }
    const api = `${this.appConfig.rest.baseUrl}/api`;
    try {
      const [nodes, route] = await Promise.all([topEntries(api, VOCABULARY), browseRouteFor(api, VOCABULARY)]);
      // "Thematic area contains <theme>" matches the theme and every heading below it; counts run in parallel
      const cards: HomeCard[] = await Promise.all(nodes.map(async (n) => ({
        label: n.label, note: n.note, icon: iconFor(n.label),
        count: await countFiltered(api, THEME_FILTER, `${n.label},contains`),
        params: { [`f.${THEME_FILTER}`]: `${n.label},contains` },
      })));
      const nonEmpty = cards.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
      this.total = nonEmpty.length;
      this.themes = nonEmpty.slice(0, SHOWN);
      this.allRoute = route;
      writeCache('themes', { themes: this.themes, total: this.total, allRoute: this.allRoute });
    } catch (e) {
      console.warn('AU-IBAR thematic areas unavailable', e);
    }
    this.loaded = true;
    this.cdr.detectChanges();
  }
}
