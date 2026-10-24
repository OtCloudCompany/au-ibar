import { isPlatformBrowser, NgFor, NgIf } from '@angular/common';
import {
  Component, Inject, OnInit, OnDestroy, PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  APP_CONFIG,
  AppConfig,
} from '@dspace/config/app-config.interface';

interface FishGovResource {
  uuid: string;
  title: string;
  description: string;
  category: string;
  image: string;
  date: string;
  featured: boolean;
}

@Component({
  selector: 'ds-auibar-fishgov2-spotlight',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './fishgov2-spotlight.component.html',
  styleUrls: ['./fishgov2-spotlight.component.scss'],
})
export class Fishgov2SpotlightComponent implements OnInit, OnDestroy {

  readonly fishgovSearch = { query: 'FishGov2' };

  // AU-IBAR (2026-10-24): use the configured REST URL instead of a hard-coded
  // relative '/server/api', which fails on localhost:4000 and on any host where
  // the REST API is not served from the same origin as the UI.
  private get base(): string {
    return `${this.appConfig.rest.baseUrl}/api`;
  }
  private readonly maxPages = 4;
  private controller?: AbortController;

  private readonly fallback: FishGovResource[] = [
    {
      uuid: 'a40713a6-01ef-4194-9ed1-8b21b7d37a2e',
      title: 'Fishing for the Future: How FishGov2 is Transforming Fisheries and Aquaculture in Africa',
      description: 'Stories of progress in African fisheries governance and aquaculture.',
      category: 'FISHERIES GOVERNANCE',
      image: 'assets/papsdl/images/fishgov2/fish2gov1.jpg',
      date: '2024',
      featured: false,
    },
    {
      uuid: '700651c0-1b8d-4325-a6e9-dfa45de0f94b',
      title: 'Building from Fish Seed Production Best Practices for a Sustainable Aquaculture Development in Africa',
      description: 'Practical knowledge supporting sustainable African aquaculture.',
      category: 'AQUACULTURE',
      image: 'assets/papsdl/images/fishgov2/fish2gov2.jpg',
      date: '',
      featured: false,
    },
    {
      uuid: '60a0fa50-3e2b-4e3a-bcea-aaca424cd947',
      title: 'Lessons Learned and Best Practices from Contemporary and Emerging Issues in African Fisheries',
      description: 'Evidence and lessons for improved fisheries management.',
      category: 'RESEARCH & POLICY',
      image: 'assets/papsdl/images/fishgov2/fish2gov3.jpg',
      date: '',
      featured: false,
    },
  ];

  resources: FishGovResource[] = [...this.fallback];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(APP_CONFIG) private appConfig: AppConfig,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.controller = new AbortController();
      void this.loadResources();
    }
  }

  ngOnDestroy(): void {
    this.controller?.abort();
  }

  private values(metadata: any, field: string): string[] {
    const entries = metadata?.[field];
    return Array.isArray(entries)
      ? entries.map((v: any) => String(v?.value ?? ''))
      : [];
  }

  private first(metadata: any, field: string): string {
    return this.values(metadata, field)[0] || '';
  }

  private isFishGov2(metadata: any): boolean {
    const fields = [
      'dc.subject',
      'dc.subject.other',
      'dc.title',
      'dc.title.alternative',
      'dc.description.abstract',
      'dc.identifier.citation',
      'au.identifier.reference',
    ];

    return fields.some(field =>
      this.values(metadata, field).some(value =>
        /fishgov[\s-]*2\b/i.test(value)
      )
    );
  }

  private isFeatured(metadata: any): boolean {
    return this.values(metadata, 'au.featured.section')
      .some(value => value.trim().toLowerCase() === 'fishgov2-home');
  }

  private categorise(metadata: any): {
    category: string;
    image: string;
  } {
    const text = [
      ...this.values(metadata, 'dc.subject'),
      ...this.values(metadata, 'dc.title'),
    ].join(' ').toLowerCase();

    if (/aquaculture|tilapia|fish seed|fish farm|cage culture/.test(text)) {
      return {
        category: 'AQUACULTURE DEVELOPMENT',
        image: 'assets/papsdl/images/fishgov2/fish2gov2.jpg',
      };
    }

    if (/trade|market|value chain|blue economy/.test(text)) {
      return {
        category: 'FISH TRADE & BLUE ECONOMY',
        image: 'assets/papsdl/images/fishgov2/fish2gov3.jpg',
      };
    }

    return {
      category: 'FISHERIES GOVERNANCE',
      image: 'assets/papsdl/images/fishgov2/fish2gov1.jpg',
    };
  }

  private toResource(item: any): FishGovResource {
    const metadata = item.metadata || {};
    const visual = this.categorise(metadata);

    const description = this.first(metadata, 'dc.description.abstract')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      uuid: item.uuid,
      title: this.first(metadata, 'dc.title') || item.name || 'Untitled',
      description,
      category: visual.category,
      image: visual.image,
      date: this.first(metadata, 'dc.date.issued'),
      featured: this.isFeatured(metadata),
    };
  }

  private async loadResources(): Promise<void> {
    const found = new Map<string, FishGovResource>();

    try {
      for (let page = 0; page < this.maxPages; page++) {
        const params = new URLSearchParams({
          query: 'FishGov2',
          page: String(page),
          size: '50',
        });

        const response = await fetch(
          `${this.base}/discover/search/objects?${params}`,
          {
            headers: { Accept: 'application/json' },
            signal: this.controller?.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`DSpace search HTTP ${response.status}`);
        }

        const data = await response.json();
        const search = data?._embedded?.searchResult;
        const results = search?._embedded?.objects || [];

        for (const result of results) {
          const item = result?._embedded?.indexableObject;

          if (!item?.uuid || !item?.metadata) {
            continue;
          }

          if (!this.isFishGov2(item.metadata)) {
            continue;
          }

          found.set(item.uuid, this.toResource(item));
        }

        const totalPages = search?.page?.totalPages;

        if (!results.length ||
            (typeof totalPages === 'number' && page + 1 >= totalPages)) {
          break;
        }
      }

      if (!found.size) {
        return;
      }

      const items = [...found.values()];

      const featured = items
        .filter(item => item.featured)
        .sort((a, b) => b.date.localeCompare(a.date));

      const latest = items
        .filter(item => !item.featured)
        .sort((a, b) => b.date.localeCompare(a.date));

      const selected = [...featured, ...latest].slice(0, 3);

      // Add verified fallback records only if fewer than three remain.
      for (const item of this.fallback) {
        if (selected.length >= 3) {
          break;
        }

        if (!selected.some(existing => existing.uuid === item.uuid)) {
          selected.push(item);
        }
      }

      const photos = [
        'assets/papsdl/images/fishgov2/fish2gov1.jpg',
        'assets/papsdl/images/fishgov2/fish2gov2.jpg',
        'assets/papsdl/images/fishgov2/fish2gov3.jpg',
      ];

      const used = new Set<string>();

      this.resources = selected.map(item => {
        const preferred = item.image;
        const image = !used.has(preferred)
          ? preferred
          : photos.find(photo => !used.has(photo)) || preferred;

        used.add(image);
        return { ...item, image };
      });

    } catch (error) {
      if (this.controller?.signal.aborted) {
        return;
      }

      console.warn(
        'FishGov2 discovery unavailable; displaying curated records.',
        error
      );
    }
  }
}
