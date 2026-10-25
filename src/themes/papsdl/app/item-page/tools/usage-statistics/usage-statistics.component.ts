/**
 * AU-IBAR (25 Oct 2026): usage statistics for an item page: visits per month, top countries (table and
 * world map) and top cities, from the DSpace usage reports.
 * Ported from the OtCloud KNBS theme (usage-statistics component); charts are drawn by AuibarChartDirective,
 * which loads Highcharts and the map module on demand. The world map (assets/papsdl/data/world-au.topo.json)
 * is the Highcharts map-collection "custom/world" TopoJSON adapted to the African Union position: Somaliland
 * merged into Somalia and Western Sahara shown as the Sahrawi Republic (changes-2026-10-24/scripts/au_map.py).
 * Charts only render in the browser (Highcharts needs a real DOM); nothing is rendered when the
 * repository does not allow the current user to see usage statistics.
 */
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { DSpaceObject } from '@dspace/core/shared/dspace-object.model';
import { UsageReport } from '@dspace/core/statistics/models/usage-report.model';
import { UsageReportDataService } from '@dspace/core/statistics/usage-report-data.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuibarChartDirective } from '../chart/auibar-chart.directive';
import { take } from 'rxjs/operators';

interface Row { indexNum: number; label: string; value: number; }

/**
 * African Union positions applied to the country statistics (table and map):
 *  - Mayotte (YT) is counted under the Comoros: OAU Council of Ministers CM/Res.496 (XXVII), 1976, "an integral
 *    part of the Independent Republic of Comoro";
 *  - the Chagos Archipelago / British Indian Ocean Territory (IO) is counted under Mauritius (AU Assembly decisions
 *    on the Chagos, ICJ advisory opinion of 25 Feb 2019);
 *  - Western Sahara (EH) is shown as the Sahrawi Arab Democratic Republic, an AU member state since 1982;
 *  - Somaliland has no country code of its own: GeoIP reports it as Somalia (SO), and the map shows Somalia whole.
 */
const AU_COUNTRY_MERGE: Record<string, string> = { YT: 'KM', IO: 'MU' };
const AU_COUNTRY_LABEL: Record<string, string> = {
  EH: 'Sahrawi Republic (Western Sahara)',
  KM: 'Comoros',
  MU: 'Mauritius',
  SO: 'Somalia',
};

@Component({
  selector: 'ds-auibar-usage-statistics',
  imports: [DecimalPipe, TranslateModule, AuibarChartDirective],
  templateUrl: './usage-statistics.component.html',
  styleUrl: './usage-statistics.component.scss',
})
export class UsageStatisticsComponent implements OnInit {
  @Input() object: DSpaceObject;

  isBrowser: boolean;
  reportsLoaded = false;
  activeTab: 1 | 2 | 3 = 1;

  months: string[] = [];
  monthViews: number[] = [];
  countriesTableData: Row[] = [];
  citiesTableData: Row[] = [];
  private countriesMapData: [string, number][] = [];

  chartOptions: any;
  mapChartOptions: any;
  citiesBarGraphOptions: any;

  constructor(
    protected usageReportDataService: UsageReportDataService,
    private http: HttpClient,
    private translate: TranslateService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) { }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (!this.object?._links?.self?.href) {
      return;
    }
    this.usageReportDataService.searchStatistics(this.object._links.self.href, 0, 10).pipe(take(1)).subscribe({
      next: (reports: UsageReport[]) => this.build(reports || []),
      error: () => this.reportsLoaded = false,
    });
  }

  private build(reports: UsageReport[]): void {
    const views = (p: any) => Number(p?.values?.['views'] || 0);
    reports.forEach(report => {
      const points = report.points || [];
      if (report.reportType === 'TotalVisitsPerMonth') {
        this.months = points.map(p => p.label);
        this.monthViews = points.map(views);
      } else if (report.reportType === 'TopCountries') {
        // apply the AU positions (see AU_COUNTRY_MERGE), then keep the top ten for both the table and the map
        const byCode = new Map<string, { label: string; value: number }>();
        points.forEach(p => {
          const raw = (p.id || p.label || '').toUpperCase();
          const code = AU_COUNTRY_MERGE[raw] || raw;
          const label = AU_COUNTRY_LABEL[code] || (code === raw ? p.label : code);
          const row = byCode.get(code) || { label, value: 0 };
          row.value += views(p);
          if (code === raw && !AU_COUNTRY_LABEL[code]) {
            row.label = p.label;
          }
          byCode.set(code, row);
        });
        [...byCode.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 10).forEach(([code, row], i) => {
          if (/^[A-Z]{2}$/.test(code)) {
            this.countriesMapData.push([code.toLowerCase(), row.value]);
          }
          this.countriesTableData.push({ indexNum: i + 1, label: row.label, value: row.value });
        });
      } else if (report.reportType === 'TopCities') {
        // top ten only, for both the table and the bar chart
        [...points].sort((a, b) => views(b) - views(a)).slice(0, 10).forEach((p, i) => {
          this.citiesTableData.push({ indexNum: i + 1, label: p.label, value: views(p) });
        });
      }
    });
    this.reportsLoaded = reports.length > 0;
    if (this.isBrowser && this.reportsLoaded) {
      this.setChartOptions();
      this.setCitiesBarGraphOptions();
      if (this.countriesMapData.length) {
        this.http.get('assets/papsdl/data/world-au.topo.json').pipe(take(1)).subscribe({
          next: topology => { this.setCountriesChartOptions(topology); this.cd.markForCheck(); },
          error: () => this.mapChartOptions = null,
        });
      }
    }
    this.cd.markForCheck();
  }

  private get viewsLabel(): string {
    return this.translate.instant('auibar.usage.views');
  }

  setChartOptions(): void {
    this.chartOptions = {
      title: { text: '' },
      credits: { enabled: false },
      xAxis: { categories: this.months },
      yAxis: { title: { text: this.viewsLabel }, allowDecimals: false, min: 0 },
      legend: { enabled: false },
      series: [{ type: 'line', name: this.viewsLabel, data: this.monthViews, color: '#1A5632' }],
    };
  }

  setCountriesChartOptions(topology: any): void {
    this.mapChartOptions = {
      chart: { map: topology },
      title: { text: '' },
      credits: { enabled: false },
      mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
      colorAxis: { min: 0, minColor: '#E8F0EA', maxColor: '#1A5632' },
      series: [{
        type: 'map',
        name: this.viewsLabel,
        data: this.countriesMapData,
        joinBy: ['hc-key', 0],
        keys: ['hc-key', 'value'],
        states: { hover: { color: '#B4A269' } },
        tooltip: { pointFormat: '{point.name}: {point.value}' },
      }],
    };
  }

  setCitiesBarGraphOptions(): void {
    this.citiesBarGraphOptions = {
      chart: { type: 'bar' },
      title: { text: '' },
      credits: { enabled: false },
      xAxis: { categories: this.citiesTableData.map(c => c.label), title: { text: null } },
      yAxis: { min: 0, allowDecimals: false, title: { text: this.viewsLabel, align: 'high' } },
      legend: { enabled: false },
      plotOptions: { bar: { dataLabels: { enabled: true } } },
      series: [{ type: 'bar', name: this.viewsLabel, data: this.citiesTableData.map(c => c.value), color: '#9F2241' }],
    };
  }
}
