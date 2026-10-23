import { addDays, format, isWeekend, startOfDay } from 'date-fns'
import { Link, useSearchParams } from 'react-router'
import { useId } from 'react'
import { ArrowUpRight, CalendarDays, Cake, Check } from 'lucide-react'
import { useCalendar } from '../../../features/calendar/useCalendar'
import { useNow } from '../../../hooks/useNow'
import { dateInputValue, eventDate, upcomingEvents } from '../../../lib/dates'
import { EventCountdown } from '../calendar/EventCountdown'
import { Icon } from '../../ui/Icon'
import { Panel } from '../../ui/Panel'
import { LoadingState } from '../../ui/LoadingState'
import { HomeDataError } from './HomeDataError'
import { useWeekContext } from '../../../features/week-context/useWeekContext'
import { DayWeather } from './DayWeather'
import { HorizontalScroll } from '../../ui/HorizontalScroll'
import { CalendarFoodAlerts } from './CalendarFoodAlerts'
import './WeekPlanner.css'
import './WeekPlannerLayout.css'

export function WeekPlanner() {
  const [search, setSearch] = useSearchParams()
  const rangeId = useId()
  const requestedDays = Number(search.get('days'))
  const dayCount =
    Number.isInteger(requestedDays) && requestedDays >= 4 && requestedDays <= 360
      ? requestedDays
      : 7
  const { events, loading, error, refresh } = useCalendar()
  const now = useNow()
  const context = useWeekContext()
  const weather = context.data?.weather
  const today = startOfDay(now)
  const upcoming = upcomingEvents(events, now)
  const days = Array.from({ length: dayCount }, (_, index) => addDays(today, index))
  const visiblePlans = upcoming.filter((event) => eventDate(event) < addDays(today, dayCount))
  const plansByDay = new Map<string, typeof upcoming>()
  for (const event of visiblePlans) {
    const key = dateInputValue(eventDate(event))
    plansByDay.set(key, [...(plansByDay.get(key) ?? []), event])
  }
  const next = upcoming[0]
  // Annual events are the calendar's existing birthday/anniversary convention.
  const annual = upcoming.find((event) => event.annually && event.id !== next?.id)
  return (
    <div className="home-diary content-surface">
      <Panel
        variant="plain"
        title="Days ahead"
        action={
          <Link to="/calendar">
            Open calendar <Icon icon={ArrowUpRight} />
          </Link>
        }
        className="week-planner"
      >
        <p className="week-planner__range-caption" role="status">
          {format(today, 'd MMM yyyy')} – {format(addDays(today, dayCount - 1), 'd MMM yyyy')} ·
          Select a day to make a plan.
        </p>
        <HomeDataError error={error} retry={refresh} />
        {loading ? (
          <LoadingState label="Loading family plans…" />
        ) : (
          <>
            <HorizontalScroll
              label="Week Ahead calendar"
              className="week-planner__scroll"
              toolbar={
                <form
                  className="week-planner__range"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const value = Number(new FormData(event.currentTarget).get('days'))
                    if (!Number.isInteger(value) || value < 4 || value > 360) return
                    setSearch(
                      (current) => {
                        const next = new URLSearchParams(current)
                        next.set('days', String(value))
                        return next
                      },
                      { replace: true },
                    )
                  }}
                >
                  <label htmlFor={rangeId}>
                    Days<span className="sr-only"> to show (4–360)</span>
                  </label>
                  <input
                    key={dayCount}
                    id={rangeId}
                    name="days"
                    type="number"
                    min="4"
                    max="360"
                    step="1"
                    required
                    defaultValue={dayCount}
                  />
                  <button
                    type="submit"
                    className="icon-button secondary"
                    aria-label="Show days"
                    title="Apply day range"
                  >
                    <Icon icon={Check} />
                  </button>
                </form>
              }
            >
              <ol className="week-planner__days" aria-label={`Next ${dayCount} days`}>
                {days.map((day, index) => {
                  const key = dateInputValue(day)
                  const weekend = isWeekend(day)
                  const plans = plansByDay.get(key) ?? []
                  const forecast = weather?.data?.find((entry) => entry.date === key)
                  const holiday = context.data?.holidays.data?.find((entry) => entry.date === key)
                  return (
                    <li key={day.toISOString()}>
                      <div
                        className={
                          'week-planner__day' +
                          (index === 0 ? ' is-today' : '') +
                          (weekend ? ' is-weekend' : '') +
                          (plans.length ? ' has-plans' : '')
                        }
                      >
                        <Link
                          to={`/calendar?compose=event&date=${key}`}
                          className="week-planner__day-main"
                          aria-label={`${format(day, 'EEEE d MMMM')}${index === 0 ? ', today' : ''}${holiday ? ', ' + holiday.title : ''}: ${error ? 'plans unavailable' : plans.length ? plans.map((plan) => plan.title).join('; ') : 'no plans'}`}
                          aria-current={index === 0 ? 'date' : undefined}
                        >
                          <span className="week-planner__day-label">
                            <span>{format(day, 'EEE')}</span>
                            {(index === 0 || day.getDate() === 1) && (
                              <span
                                className="week-planner__month"
                                title={format(day, 'MMMM yyyy')}
                                aria-hidden="true"
                              >
                                {format(
                                  day,
                                  day.getFullYear() === today.getFullYear() ? 'MMM' : 'MMM yy',
                                )}
                              </span>
                            )}
                          </span>
                          <strong>{format(day, 'd')}</strong>
                          {holiday && (
                            <span className="week-planner__holiday" title={holiday.title}>
                              {holiday.title}
                            </span>
                          )}
                          {plans.length && !error ? (
                            <span className="week-planner__highlight">
                              <strong title={plans[0].title}>{plans[0].title}</strong>
                              {plans.length > 1 && <small>+{plans.length - 1} more</small>}
                            </span>
                          ) : error || index === 0 ? (
                            <small>{error ? 'Check calendar' : 'Today'}</small>
                          ) : null}
                        </Link>
                        {index === 0 && <CalendarFoodAlerts />}
                        {forecast && weather && (
                          <DayWeather
                            day={forecast}
                            location={weather.location}
                            timeZone={weather.timeZone}
                            updatedAt={weather.updatedAt}
                            stale={
                              weather.status === 'stale' ||
                              context.isError ||
                              (weather.updatedAt !== null &&
                                now - Date.parse(weather.updatedAt) > 1800000)
                            }
                          />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </HorizontalScroll>
            {!error && (
              <p className="week-planner__count">
                {visiblePlans.length} {visiblePlans.length === 1 ? 'plan' : 'plans'} in the next{' '}
                {dayCount} days · {upcoming.length} upcoming in your family calendar
              </p>
            )}
          </>
        )}
      </Panel>
      <aside className="home-diary__next" aria-labelledby={rangeId + '-next'}>
        <h2 id={rangeId + '-next'}>Next in your diary</h2>
        {loading ? (
          <LoadingState label="Loading next event…" />
        ) : error ? (
          <p className="home-diary__unavailable">Open the calendar to check upcoming dates.</p>
        ) : (
          <>
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
              <div className="week-planner__quiet">
                <Icon icon={CalendarDays} />
                <div>
                  <strong>A little breathing room.</strong>
                  <p>No upcoming plans. Open the calendar to plan something together.</p>
                </div>
              </div>
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
          </>
        )}
      </aside>
    </div>
  )
}
