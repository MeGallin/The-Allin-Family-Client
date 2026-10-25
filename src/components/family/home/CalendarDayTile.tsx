import { useEffect, type ReactNode } from 'react'
import { format, isWeekend } from 'date-fns'
import { Link, useSearchParams } from 'react-router'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import { IndicatorStrip, type CalendarIndicator } from '../../ui/IndicatorStrip'
import { Modal } from '../../ui/Modal'
import { dateInputValue, formatEventTime } from '../../../lib/dates'
import { calendarEventPath } from '../../../features/calendar/calendar-selection'
import './CalendarDayTile.css'

export type CalendarDayTileProps = {
  date: Date
  calendarHref: string
  isToday: boolean
  monthLabel?: string
  plans: readonly { id: string; title: string; startsAt: string; allDay: boolean; detail: string }[]
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
  const [search, setSearch] = useSearchParams()
  const dayKey = dateInputValue(date)
  const showPlans = search.get('plans') === dayKey
  function closePlans() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('plans')
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }
  useEffect(() => {
    if (plansUnavailable && showPlans)
      setSearch(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('plans')
          return next
        },
        { replace: true, preventScrollReset: true },
      )
  }, [plansUnavailable, showPlans, setSearch])
  const dayLabel = format(date, 'EEEE d MMMM')
  const summary = plansUnavailable
    ? 'plans unavailable'
    : plans.length
      ? `${plans.length} ${plans.length === 1 ? 'plan' : 'plans'}`
      : 'no plans'
  const label = `${dayLabel}${isToday ? ', today' : ''}${holidayTitle ? ', ' + holidayTitle : ''}: ${summary}`
  const planSummary = (
    <>
      <span>
        <strong>{plansUnavailable ? 'Check calendar' : (plans[0]?.title ?? 'No plans yet')}</strong>
        {!plansUnavailable && plans.length > 0 && (
          <small>{plans.length > 1 ? `${plans.length} plans · View all` : 'View plan'}</small>
        )}
      </span>
      <Icon icon={plans.length ? ArrowUpRight : Plus} />
    </>
  )
  return (
    <>
      <div
        className={
          'calendar-day-tile week-planner__day' +
          (!plansUnavailable && plans.length ? ' has-plans' : '') +
          (isToday ? ' is-today' : '') +
          (weekend ? ' is-weekend' : '')
        }
      >
        <div className="calendar-day-tile__calendar week-planner__day-main">
          <Link
            to={calendarHref}
            className="calendar-day-tile__identity"
            aria-label={label + '. Add a plan.'}
            title={'Add a plan · ' + dayLabel}
            aria-current={isToday ? 'date' : undefined}
          >
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
          </Link>
          {!plansUnavailable && plans.length ? (
            <button
              type="button"
              className="calendar-day-tile__plan has-plan"
              aria-label={`View ${plans.length} ${plans.length === 1 ? 'plan' : 'plans'} for ${dayLabel}`}
              onClick={() =>
                setSearch(
                  (current) => {
                    const next = new URLSearchParams(current)
                    next.set('plans', dayKey)
                    return next
                  },
                  { replace: true, preventScrollReset: true },
                )
              }
            >
              {planSummary}
            </button>
          ) : (
            <Link
              className="calendar-day-tile__plan"
              to={plansUnavailable ? '/calendar' : calendarHref}
              aria-label={`${plansUnavailable ? 'Check calendar' : 'Make a plan'} for ${dayLabel}`}
            >
              {planSummary}
            </Link>
          )}
        </div>
        <div className="calendar-day-tile__forecast">{forecast}</div>
        <IndicatorStrip indicators={indicators} dayLabel={dayLabel} />
      </div>
      {showPlans && !plansUnavailable && (
        <Modal
          title={`Plans for ${format(date, 'EEEE d MMMM')}`}
          onClose={closePlans}
          scrollable
          className="calendar-day-plans"
        >
          <p className="note">
            {plans.length} {plans.length === 1 ? 'saved family plan' : 'saved family plans'} · Times
            shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}.
          </p>
          <ul className="calendar-day-plans__list">
            {plans.map((plan) => (
              <li key={plan.id}>
                <span className="calendar-day-plans__time">
                  {plan.allDay ? 'All day' : formatEventTime(plan.startsAt)}
                </span>
                <h3>{plan.title}</h3>
                {plan.detail && <p>{plan.detail}</p>}
                <Link
                  to={calendarEventPath(plan, dayKey)}
                  aria-label={`Open ${plan.title} in calendar`}
                >
                  Open in calendar <Icon icon={ArrowUpRight} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="calendar-day-plans__actions">
            <Link to={calendarHref} className="button-link">
              Add another plan
            </Link>
          </div>
        </Modal>
      )}
    </>
  )
}
