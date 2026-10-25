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
  childLabels,
  facetCounts,
  HomeCard,
  iconFor,
  readCache,
  topEntries,
  writeCache,
} from '../shared/vocabulary-home';

/** Vocabulary of AU-IBAR knowledge product types and the Discovery facet on dc.type (see discovery.xml). */
const VOCABULARY = 'auibar-types';
const FACET = 'itemtype';
const SHOWN = 6;

/**
 * AU-IBAR (25 Oct 2026): "Explore by Resource Type" shows the six most-used AU-IBAR knowledge product types
 * with their item counts, each linking to the type filter; the type's group in the vocabulary is shown under
 * its name. Labels, groups, counts and links all come from the REST API; "Explore all resource groups" opens
 * the browse index registered for the type vocabulary.
 */
@Component({
  selector: 'ds-auibar-document-types',
  standalone: true,
  imports: [DecimalPipe, NgFor, NgIf, RouterLink],
  templateUrl: './document-types.component.html',
  styleUrls: ['./document-types.component.scss'],
})
export class DocumentTypesComponent implements OnInit {
  types: HomeCard[] = [];
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
    const cached = readCache<{ types: HomeCard[]; allRoute: string | null }>('types');
    if (cached) {
      Object.assign(this, cached);
      this.loaded = true;
      this.cdr.detectChanges();
    }
    const api = `${this.appConfig.rest.baseUrl}/api`;
    try {
      const [counts, groups, route] = await Promise.all([
        facetCounts(api, FACET), topEntries(api, VOCABULARY), browseRouteFor(api, VOCABULARY),
      ]);
      // group of each type, from the vocabulary
      const groupOf = new Map<string, string>();
      await Promise.all(groups.map(async (g) => (await childLabels(api, g.id)).forEach((t) => groupOf.set(t, g.label))));
      this.types = [...counts.entries()]
        .filter(([type, count]) => count > 0 && groupOf.has(type))
        .sort((a, b) => b[1] - a[1])
        .slice(0, SHOWN)
        .map(([type, count]) => ({
          label: type,
          note: groupOf.get(type),
          count,
          icon: iconFor(`${type} ${groupOf.get(type)}`),
          params: { [`f.${FACET}`]: `${type},equals` },
        }));
      this.allRoute = route;
      writeCache('types', { types: this.types, allRoute: this.allRoute });
    } catch (e) {
      console.warn('AU-IBAR resource types unavailable', e);
    }
    this.loaded = true;
    this.cdr.detectChanges();
  }
}
