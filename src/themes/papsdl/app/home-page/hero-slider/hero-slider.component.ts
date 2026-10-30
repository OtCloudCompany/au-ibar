import {
  isPlatformBrowser,
  NgFor,
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ThematicAreasComponent } from '../thematic-areas/thematic-areas.component';

interface HeroSlide {
  title: string;
  description: string;
  eyebrow: string;
  background: string;
}

@Component({
  selector: 'ds-paps-hero-slider',
  standalone: true,
  templateUrl: './hero-slider.component.html',
  styleUrls: ['./hero-slider.component.scss'],
  imports: [
    NgFor,
    RouterLink,
    ThematicAreasComponent,
  ],
})
export class HeroSliderComponent implements OnInit, OnDestroy {

  slides: HeroSlide[] = [
    {
      eyebrow: 'AFRICAN UNION · AU-IBAR',
      // AU-IBAR feedback 30 Oct 2026: banner wording
      title: "Knowledge on Africa's Animal Resources",
      description:
        "Explore research, policies and institutional knowledge supporting food security, sustainable fisheries, aquaculture and Africa's Blue Economy.",
      background: 'linear-gradient(115deg, #103E28 0%, #1A5632 55%, #348F41 100%)',
    },
    {
      eyebrow: 'FISHGOV2 · KNOWLEDGE AND POLICY',
      title: 'Strengthening Fisheries Governance in Africa',
      description:
        // AU-IBAR feedback 30 Oct 2026: section description
        'Discover knowledge products that support evidence-based policy, sustainable resource management, and regional cooperation on fisheries governance, aquaculture and the blue economy.',
      background: 'linear-gradient(115deg, #163F34 0%, #256746 55%, #348F41 100%)',
    },
    {
      eyebrow: 'AU-IBAR · INSTITUTIONAL KNOWLEDGE',
      title: 'Preserving Knowledge. Expanding Access.',
      description:
        'Access technical reports, policy briefs, guidelines, research outputs, training materials and multimedia resources.',
      background: 'linear-gradient(115deg, #173B2B 0%, #1A5632 52%, #527A4C 100%)',
    },
  ];

  activeSlide = 0;
  paused = false;

  private intervalId?: ReturnType<typeof setInterval>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoPlay();
      void this.loadSliderImages();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  next(): void {
    if (!this.slides.length) {
      return;
    }

    this.activeSlide =
      (this.activeSlide + 1) % this.slides.length;

    this.cdr.detectChanges();
  }

  previous(): void {
    if (!this.slides.length) {
      return;
    }

    this.activeSlide =
      (this.activeSlide - 1 + this.slides.length) %
      this.slides.length;
  }

  goToSlide(index: number): void {
    this.activeSlide = index;
  }

  togglePause(): void {
    this.paused = !this.paused;

    if (this.paused) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  private async loadSliderImages(): Promise<void> {
    try {
      const response = await fetch(
        '/assets/auibar-slider/manifest.json',
        { cache: 'no-store' },
      );

      if (!response.ok) {
        return;
      }

      const manifest: {
        images?: Array<{ url?: string }>;
      } = await response.json();

      if (!Array.isArray(manifest.images)) {
        return;
      }

      const images = manifest.images
        .filter((image) =>
          typeof image?.url === 'string' &&
          /^\/assets\/auibar-slider\/images\/auibar-[a-f0-9]{20}\.webp$/.test(image.url),
        )
        .slice(0, 30);

      if (!images.length) {
        return;
      }

      const messages = [...this.slides];

      this.slides = images.map((image, index) => ({
        ...messages[index % messages.length],
        background: `url("${image.url}")`,
      }));

      this.activeSlide = 0;
      this.cdr.detectChanges();

    } catch (error) {
      console.warn(
        'AU-IBAR slider photos unavailable; using fallback.',
        error,
      );
    }
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();

    this.intervalId = setInterval(() => {
      this.ngZone.run(() => {
        this.next();
      });
    }, 20000);
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
