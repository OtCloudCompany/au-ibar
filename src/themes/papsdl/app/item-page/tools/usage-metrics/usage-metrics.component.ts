/**
 * AU-IBAR (25 Oct 2026): total views and downloads for an item, from the DSpace usage reports.
 * Ported from the OtCloud KNBS theme (usage-metrics component). Renders nothing when the
 * repository does not allow the current user to see usage statistics.
 */
import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { DSpaceObject } from '@dspace/core/shared/dspace-object.model';
import { UsageReport } from '@dspace/core/statistics/models/usage-report.model';
import { UsageReportDataService } from '@dspace/core/statistics/usage-report-data.service';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ds-auibar-usage-metrics',
  imports: [DecimalPipe, TranslateModule],
  templateUrl: './usage-metrics.component.html',
  styleUrl: './usage-metrics.component.scss',
})
export class UsageMetricsComponent implements OnInit {
  @Input() item: DSpaceObject;
  /** false on entity pages (organisations, persons, journals), which have no files to download */
  @Input() showDownloads = true;

  reportsLoaded = false;
  totalViews = 0;
  totalDownloads: number | null = null;

  constructor(private usageReportDataService: UsageReportDataService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (!this.item?._links?.self?.href) {
      return;
    }
    this.usageReportDataService.searchStatistics(this.item._links.self.href, 0, 10).pipe(take(1)).subscribe({
      next: (reports: UsageReport[]) => {
        (reports || []).forEach(report => {
          const sum = (report.points || []).reduce((total, point) => total + Number(point.values?.['views'] || 0), 0);
          if (report.reportType === 'TotalVisits') {
            this.totalViews = sum;
          } else if (report.reportType === 'TotalDownloads') {
            this.totalDownloads = sum;
          }
        });
        this.reportsLoaded = (reports || []).length > 0;
        this.cd.markForCheck();
      },
      error: () => this.reportsLoaded = false,
    });
  }
}
