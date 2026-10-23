import { CalendarDays } from 'lucide-react'
import type { CalendarIndicator } from '../../ui/IndicatorStrip'
import { AlertSource } from '../../ui/AlertBriefing'

export function holidayCalendarIndicator(
  title: string,
  dayLabel: string,
  region: string,
): CalendarIndicator {
  return {
    id: 'bank-holiday',
    label: 'Holiday',
    accessibleLabel: title + ' · ' + region,
    description: title,
    source: 'GOV.UK bank holidays',
    icon: CalendarDays,
    tone: 'accent',
    priority: 10,
    dialogTitle: 'Bank holiday · ' + dayLabel,
    details: () => (
      <section className="indicator-dialog__simple">
        <AlertSource
          provider="GOV.UK"
          description={region}
          icon={CalendarDays}
          href="https://www.gov.uk/bank-holidays"
          linkLabel="Official dates"
        />
        <h3>{title}</h3>
        <p>
          {dayLabel} · {region}
        </p>
      </section>
    ),
  }
}
