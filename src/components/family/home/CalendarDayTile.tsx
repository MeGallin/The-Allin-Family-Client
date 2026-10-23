import type { ReactNode } from 'react'
import { format, isWeekend } from 'date-fns'
import { Link } from 'react-router'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import { IndicatorStrip, type CalendarIndicator } from '../../ui/IndicatorStrip'
import './CalendarDayTile.css'

export type CalendarDayTileProps = {
  date: Date
  calendarHref: string
  isToday: boolean
  monthLabel?: string
  plans: readonly { title: string }[]
  plansUnavailable: boolean
  holidayTitle?: string
  forecast: ReactNode
  indicators: readonly CalendarIndicator[]
}

/** Split glance presentation only. The parent supplies saved data and service indicators. */
export function CalendarDayTile({
  date,
  calendarHref,
  isToday,
  monthLabel,
  plans,
  plansUnavailable,
  holidayTitle,
  forecast,
  indicators,
}: CalendarDayTileProps) {
  const weekend = isWeekend(date)
  const dayLabel = format(date, 'EEEE d MMMM')
  const summary = plansUnavailable
    ? 'plans unavailable'
    : plans.length
      ? plans.map((plan) => plan.title).join('; ')
      : 'no plans'
  const label = `${dayLabel}${isToday ? ', today' : ''}${holidayTitle ? ', ' + holidayTitle : ''}: ${summary}`
  return (
    <div
      className={
        'calendar-day-tile week-planner__day' +
        (!plansUnavailable && plans.length ? ' has-plans' : '') +
        (isToday ? ' is-today' : '') +
        (weekend ? ' is-weekend' : '')
      }
    >
      <Link
        to={calendarHref}
        className="calendar-day-tile__calendar week-planner__day-main"
        aria-label={label}
        title={'Open calendar · ' + label}
        aria-current={isToday ? 'date' : undefined}
      >
        <span className="calendar-day-tile__identity">
          <strong>{format(date, 'd')}</strong>
          <span className="calendar-day-tile__date-copy">
            <span className="week-planner__day-label">
              {format(date, 'EEE')}
              {monthLabel && (
                <span className="week-planner__month" aria-hidden="true">
                  {monthLabel}
                </span>
              )}
            </span>
            {(isToday || weekend) && <small>{isToday ? 'Today' : 'Weekend'}</small>}
          </span>
        </span>
        <span
          className={
            'calendar-day-tile__plan' + (!plansUnavailable && plans.length ? ' has-plan' : '')
          }
        >
          <span>
            <strong>
              {plansUnavailable ? 'Check calendar' : (plans[0]?.title ?? 'No plans yet')}
            </strong>
            {!plansUnavailable && plans.length > 1 && <small>+{plans.length - 1} more</small>}
          </span>
          <Icon icon={plans.length ? ArrowUpRight : Plus} />
        </span>
      </Link>
      <div className="calendar-day-tile__forecast">{forecast}</div>
      <IndicatorStrip indicators={indicators} dayLabel={dayLabel} />
    </div>
  )
}
