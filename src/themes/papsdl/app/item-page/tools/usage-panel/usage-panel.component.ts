/**
 * AU-IBAR (25 Oct 2026): usage block for entity pages (organisations, persons, journals): total views and
 * downloads plus the usage-statistics tabs, in one card. Hidden when there is nothing to show.
 */
import { Component, Input } from '@angular/core';
import { DSpaceObject } from '@dspace/core/shared/dspace-object.model';
import { TranslateModule } from '@ngx-translate/core';
import { UsageMetricsComponent } from '../usage-metrics/usage-metrics.component';
import { UsageStatisticsComponent } from '../usage-statistics/usage-statistics.component';

@Component({
  selector: 'ds-auibar-usage-panel',
  imports: [TranslateModule, UsageMetricsComponent, UsageStatisticsComponent],
  templateUrl: './usage-panel.component.html',
  styleUrl: './usage-panel.component.scss',
})
export class UsagePanelComponent {
  @Input() object: DSpaceObject;
}
