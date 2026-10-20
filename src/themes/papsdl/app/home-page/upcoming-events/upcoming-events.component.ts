import {
  isPlatformBrowser,
  NgFor,
  NgIf,
} from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';

interface CalendarEvent {
  title: string;
  location: string;
  start: Date;
  allDay: boolean;
}

@Component({
  selector: 'ds-paps-upcoming-events',
  standalone: true,
  templateUrl: './upcoming-events.component.html',
  styleUrls: ['./upcoming-events.component.scss'],
  imports: [
    NgFor,
    NgIf,
  ],
})
export class UpcomingEventsComponent implements OnInit {

  upcomingEvents: CalendarEvent[] = [];
  loading = true;
  failed = false;

  readonly calendarUrl =
    'https://papsedms.africanunion.org/index.php/apps/calendar/p/s5xi2YA6BrgFASty';

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadCalendar();
  }

  private async loadCalendar(): Promise<void> {
    try {
      const response = await fetch('/paps-calendar.ics', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Calendar returned ${response.status}`);
      }

      const ics = await response.text();
      const events = this.parseCalendar(ics);
      const now = new Date();

      this.upcomingEvents = events
        .filter((event) => event.start.getTime() >= now.getTime())
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 3);

      this.loading = false;
    } catch (error) {
      console.error('Unable to load PSC calendar', error);
      this.failed = true;
      this.loading = false;
    }
  }

  private parseCalendar(ics: string): CalendarEvent[] {
    const unfolded = ics.replace(/\r?\n[ \t]/g, '');
    const blocks = unfolded.split('BEGIN:VEVENT').slice(1);

    return blocks
      .map((block) => {
        const body = block.split('END:VEVENT')[0];

        const summary = this.getProperty(body, 'SUMMARY');
        const location = this.getProperty(body, 'LOCATION');

        const dtStartLine = body
          .split(/\r?\n/)
          .find((line) => line.startsWith('DTSTART'));

        if (!dtStartLine) {
          return undefined;
        }

        const value = dtStartLine.substring(
          dtStartLine.indexOf(':') + 1,
        );

        const allDay =
          dtStartLine.includes('VALUE=DATE') ||
          /^\d{8}$/.test(value);

        const start = this.parseDate(value);

        if (!start || Number.isNaN(start.getTime())) {
          return undefined;
        }

        return {
          title: this.decodeIcs(summary || 'PSC Event'),
          location: this.decodeIcs(location || ''),
          start,
          allDay,
        };
      })
      .filter((event): event is CalendarEvent => !!event);
  }

  private getProperty(block: string, property: string): string {
    const line = block
      .split(/\r?\n/)
      .find((entry) =>
        entry.startsWith(`${property}:`) ||
        entry.startsWith(`${property};`),
      );

    return line
      ? line.substring(line.indexOf(':') + 1)
      : '';
  }

  private parseDate(value: string): Date | undefined {
    const match = value.match(
      /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/,
    );

    if (!match) {
      return undefined;
    }

    const [
      ,
      year,
      month,
      day,
      hour = '00',
      minute = '00',
      second = '00',
      utc,
    ] = match;

    if (utc) {
      return new Date(Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ));
    }

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
  }

  private decodeIcs(value: string): string {
    return value
      .replace(/\\n/gi, ' ')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  getDay(event: CalendarEvent): string {
    return String(event.start.getDate()).padStart(2, '0');
  }

  getMonth(event: CalendarEvent): string {
    return event.start
      .toLocaleDateString('en-GB', { month: 'short' })
      .toUpperCase();
  }

  getFormattedDate(event: CalendarEvent): string {
    return event.start.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getFormattedTime(event: CalendarEvent): string {
    if (event.allDay) {
      return '';
    }

    return event.start.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
