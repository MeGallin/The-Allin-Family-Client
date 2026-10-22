import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { Link } from 'react-router'
import { ArrowUpRight, CalendarDays, Cake } from 'lucide-react'
import { useCalendar } from '../../../features/calendar/useCalendar'
import { useNow } from '../../../hooks/useNow'
import { eventDate, upcomingEvents } from '../../../lib/dates'
import { EventCountdown } from '../calendar/EventCountdown'
import { Icon } from '../../ui/Icon'
import { Panel } from '../../ui/Panel'
import { LoadingState } from '../../ui/LoadingState'
import { HomeDataError } from './HomeDataError'
import './WeekPlanner.css'

export function WeekPlanner() {
  const { events, loading, error, refresh } = useCalendar()
  const now = useNow()
  const today = startOfDay(now)
  const upcoming = upcomingEvents(events, now)
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index))
  const thisWeek = upcoming.filter((event) => eventDate(event) < addDays(today, 7))
  const next = upcoming[0]
  // Annual events are the calendar's existing birthday/anniversary convention.
  const annual = upcoming.find((event) => event.annually && event.id !== next?.id)
  return (
    <Panel
      title="The next seven days"
      action={
        <Link to="/calendar">
          Open calendar <Icon icon={ArrowUpRight} />
        </Link>
      }
      className="week-planner"
    >
      <HomeDataError error={error} retry={refresh} />
      {loading ? (
        <LoadingState label="Loading family plans…" />
      ) : (
        <>
          <ol className="week-planner__days" aria-label="Next seven days">
            {days.map((day, index) => {
              const plans = upcoming.filter((event) => isSameDay(eventDate(event), day))
              return (
                <li key={day.toISOString()}>
                  <Link
                    to="/calendar"
                    className={
                      'week-planner__day' +
                      (index === 0 ? ' is-today' : '') +
                      (plans.length ? ' has-plans' : '')
                    }
                    aria-label={`${format(day, 'EEEE d MMMM')}${index === 0 ? ', today' : ''}: ${error ? 'plans unavailable' : plans.length ? plans.map((plan) => plan.title).join('; ') : 'no plans'}`}
                    aria-current={index === 0 ? 'date' : undefined}
                  >
                    <span>{format(day, 'EEE')}</span>
                    <strong>{format(day, 'd')}</strong>
                    {plans.length && !error ? (
                      <span className="week-planner__highlight">
                        <strong title={plans[0].title}>{plans[0].title}</strong>
                        {plans.length > 1 && <small>+{plans.length - 1} more</small>}
                      </span>
                    ) : (
                      <small>
                        {error ? 'Check calendar' : index === 0 ? 'Today' : format(day, 'MMM')}
                      </small>
                    )}
                  </Link>
                </li>
              )
            })}
          </ol>
          {next ? (
            <Link className="week-planner__next" to="/calendar">
              <span className="week-planner__date" aria-hidden="true">
                <strong>{format(eventDate(next), 'd')}</strong>
                <span>{format(eventDate(next), 'MMM')}</span>
              </span>
              <span className="week-planner__copy">
                <small>Next on the calendar</small>
                <strong>{next.title}</strong>
                <span>
                  {format(eventDate(next), 'EEEE, d MMMM')} ·{' '}
                  {next.allDay ? 'All day' : format(eventDate(next), 'HH:mm')}
                </span>
                <EventCountdown event={next} />
              </span>
              <Icon icon={ArrowUpRight} />
            </Link>
          ) : (
            !error && (
              <div className="week-planner__quiet">
                <Icon icon={CalendarDays} />
                <div>
                  <strong>A little breathing room.</strong>
                  <p>No upcoming plans. Open the calendar to plan something together.</p>
                </div>
              </div>
            )
          )}
          {annual && (
            <Link className="week-planner__annual" to="/calendar">
              <Icon icon={Cake} />
              <span>
                <small>Another date to remember</small>
                <strong>{annual.title}</strong>
                <span>
                  {format(eventDate(annual), 'd MMMM')} · <EventCountdown event={annual} />
                </span>
              </span>
              <Icon icon={ArrowUpRight} />
            </Link>
          )}
          {!error && (
            <p className="week-planner__count">
              {thisWeek.length} {thisWeek.length === 1 ? 'plan' : 'plans'} this week ·{' '}
              {upcoming.length} upcoming in your family calendar
            </p>
          )}
        </>
      )}
    </Panel>
  )
}
