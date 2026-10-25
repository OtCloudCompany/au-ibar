/**
 * AU-IBAR (25 Oct 2026): draws a Highcharts chart into the host element.
 * Highcharts (and its map module for map charts) is loaded on demand, in the browser only, so it adds
 * nothing to the server-side render or to pages without charts, and needs no app-wide provider
 * (highcharts-angular 5 requires provideHighcharts() in the application config, which is core).
 * Highcharts 12+ follows the visitor's operating-system dark mode (black chart background); the
 * "highcharts-light" class forces its light colours so charts always match the white repository pages.
 */
import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Inject, Input, OnChanges, OnDestroy, PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[dsAuibarChart]',
  standalone: true,
  host: { class: 'highcharts-light' },
})
export class AuibarChartDirective implements OnChanges, OnDestroy {
  @Input('dsAuibarChart') options: any;
  @Input() chartType: 'chart' | 'mapChart' = 'chart';

  private chart: any;
  private destroyed = false;

  constructor(private el: ElementRef<HTMLElement>, @Inject(PLATFORM_ID) private platformId: object) { }

  ngOnChanges(): void {
    if (!isPlatformBrowser(this.platformId) || !this.options) {
      return;
    }
    this.render();
  }

  private async render(): Promise<void> {
    const Highcharts: any = (await import('highcharts/esm/highcharts')).default;
    if (this.chartType === 'mapChart') {
      await import('highcharts/esm/modules/map');
    }
    if (this.destroyed) {
      return;
    }
    this.chart?.destroy();
    const options = { ...this.options, chart: { backgroundColor: 'transparent', ...(this.options.chart || {}) } };
    this.chart = this.chartType === 'mapChart'
      ? Highcharts.mapChart(this.el.nativeElement, options)
      : Highcharts.chart(this.el.nativeElement, options);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.chart?.destroy();
    this.chart = undefined;
  }
}
