import { addDays, format, startOfDay } from 'date-fns'
import { Link, useSearchParams } from 'react-router'
import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { ArrowUpRight, CalendarDays, Cake, Minus, Plus } from 'lucide-react'
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
import { useFoodCalendarIndicator } from './CalendarFoodAlerts'
import { weatherCalendarIndicator } from './CalendarWeatherWarnings'
import { CalendarDayTile } from './CalendarDayTile'
import { holidayCalendarIndicator } from './calendar-day-indicators'
import type { CalendarIndicator } from '../../ui/IndicatorStrip'
import { useWeatherWarnings } from '../../../features/weather-warnings/useWeatherWarnings'
import { weatherWarningView } from '../../../features/weather-warnings/warning-view'
import { useTravel } from '../../../features/travel/useTravel'
import { prepareTravelView } from '../../../features/travel/travel-view'
import { travelCalendarIndicator } from './CalendarTravel'
import { calendarDayPlans } from './calendar-day-plans'
import { calendarEventPath } from '../../../features/calendar/calendar-selection'
import { useHomeOverview } from '../../../features/family/useHomeOverview'
import { HomeOverview } from '../HomeOverview'
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
  const [rangeDraft, setRangeDraft] = useState(() => String(dayCount))
  const [applying, startApplying] = useTransition()
  const applyInFlight = useRef(false)
  useEffect(() => setRangeDraft(String(dayCount)), [dayCount])
  useEffect(() => {
    if (!applying) applyInFlight.current = false
  }, [applying, dayCount])
  const proposedDays = Number(rangeDraft)
  const validRange =
    rangeDraft !== '' && Number.isInteger(proposedDays) && proposedDays >= 4 && proposedDays <= 360
  const rangeChanged = validRange && proposedDays !== dayCount
  const showRangeStatus = !validRange || applying
  const { events, loading, error, refresh } = useCalendar()
  const now = useNow()
  const context = useWeekContext()
  const foodIndicator = useFoodCalendarIndicator()
  const warningFeed = useWeatherWarnings()
  const warningView = weatherWarningView(warningFeed.data, warningFeed.isError, now)
  const travelFeed = useTravel()
  const travelForDay = prepareTravelView(travelFeed.data, travelFeed.isError, now)
  const weather = context.data?.weather
  const today = startOfDay(now)
  const rangeEnd = addDays(today, dayCount - 1)
  const formatRange = (end: Date) =>
    `${format(today, today.getFullYear() === end.getFullYear() ? 'd MMM' : 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`
  const stepRange = (step: number) => {
    if (applying || applyInFlight.current) return
    setRangeDraft((current) => {
      const value = Number(current)
      const base = current !== '' && Number.isInteger(value) ? value : dayCount
      return String(Math.min(360, Math.max(4, base + step)))
    })
  }
  const upcoming = upcomingEvents(events, now)
  const days = Array.from({ length: dayCount }, (_, index) => addDays(today, index))
  const visiblePlans = calendarDayPlans(events, now, dayCount)
  const overview = useHomeOverview({
    dayCount,
    visiblePlans: visiblePlans.length,
    upcomingPlans: upcoming.length,
    loading,
    error: !!error,
  })
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
        <div className="week-planner__range-caption" role="status">
          <p className="week-planner__range-current">
            <span className="week-planner__range-label">
              {rangeChanged ? 'Preview range' : 'Calendar window'}
            </span>
            <strong>
              {formatRange(rangeChanged ? addDays(today, proposedDays - 1) : rangeEnd)}
            </strong>
          </p>
        </div>
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
                  aria-busy={applying}
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!rangeChanged || applying || applyInFlight.current) return
                    applyInFlight.current = true
                    startApplying(() =>
                      setSearch(
                        (current) => {
                          const next = new URLSearchParams(current)
                          next.set('days', String(proposedDays))
                          return next
                        },
                        { replace: true },
                      ),
                    )
                  }}
                >
                  <div className="week-planner__stepper">
                    <label htmlFor={rangeId} className="sr-only">
                      day view — number of days in calendar range (4 to 360)
                    </label>
                    <button
                      type="button"
                      className="icon-button secondary week-planner__step"
                      aria-label="Show one fewer day"
                      disabled={applying || (validRange && proposedDays <= 4)}
                      onClick={() => stepRange(-1)}
                    >
                      <Icon icon={Minus} />
                    </button>
                    <div className="week-planner__day-count">
                      <input
                        id={rangeId}
                        name="days"
                        type="number"
                        inputMode="numeric"
                        min="4"
                        max="360"
                        step="1"
                        required
                        value={rangeDraft}
                        disabled={applying}
                        aria-describedby={
                          rangeId + '-hint' + (showRangeStatus ? ' ' + rangeId + '-status' : '')
                        }
                        aria-invalid={!validRange}
                        onChange={(event) => {
                          setRangeDraft(event.target.value)
                        }}
                      />
                      <span className="week-planner__day-count-caption" aria-hidden="true">
                        day view
                      </span>
                    </div>
                    <button
                      type="button"
                      className="icon-button secondary week-planner__step"
                      aria-label="Show one more day"
                      disabled={applying || (validRange && proposedDays >= 360)}
                      onClick={() => stepRange(1)}
                    >
                      <Icon icon={Plus} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className={'week-planner__apply' + (rangeChanged ? '' : ' secondary')}
                    aria-label={rangeChanged ? `Apply ${proposedDays} days` : 'Apply days'}
                    disabled={!rangeChanged || applying}
                    title="Apply day range"
                  >
                    Apply
                  </button>
                  <span id={rangeId + '-hint'} className="sr-only">
                    Apply a whole number from 4 to 360 to update the displayed calendar.
                  </span>
                </form>
              }
              toolbarStatus={
                showRangeStatus && (
                  <div
                    id={rangeId + '-status'}
                    className="week-planner__range-status"
                    role="status"
                  >
                    <p className={!validRange ? 'week-planner__range-error' : undefined}>
                      {!validRange ? 'Enter a whole number from 4 to 360.' : 'Applying…'}
                    </p>
                  </div>
                )
              }
            >
              <ol className="week-planner__days" aria-label={`Next ${dayCount} days`}>
                {days.map((day, index) => {
                  const key = dateInputValue(day)
                  const plans = plansByDay.get(key) ?? []
                  const forecast = weather?.data?.find((entry) => entry.date === key)
                  const holiday = context.data?.holidays.data?.find((entry) => entry.date === key)
                  const warnings = warningView.warnings.filter(
                    (warning) => warning.startsOn <= key && warning.endsOn >= key,
                  )
                  const warningIndicator = weatherCalendarIndicator({
                    day: key,
                    warnings,
                    location: warningFeed.data?.location ?? '',
                    updatedAt: warningFeed.data?.updatedAt ?? null,
                    stale: warningView.stale,
                  })
                  const indicators: CalendarIndicator[] = []
                  if (warningIndicator) indicators.push(warningIndicator)
                  if (index === 0 && foodIndicator) indicators.push(foodIndicator)
                  const travelIndicator = travelCalendarIndicator(
                    {
                      day: key,
                      ...travelForDay(key),
                    },
                    index === 0,
                  )
                  if (travelIndicator) indicators.push(travelIndicator)
                  if (holiday)
                    indicators.push(
                      holidayCalendarIndicator(
                        holiday.title,
                        format(day, 'EEEE d MMMM'),
                        context.data?.holidays.region ?? '',
                      ),
                    )
                  return (
                    <li key={day.toISOString()}>
                      <CalendarDayTile
                        date={day}
                        calendarHref={`/calendar?compose=event&date=${key}`}
                        isToday={index === 0}
                        monthLabel={
                          index === 0 || day.getDate() === 1
                            ? format(
                                day,
                                day.getFullYear() === today.getFullYear() ? 'MMM' : 'MMM yy',
                              )
                            : undefined
                        }
                        plans={plans}
                        plansUnavailable={!!error}
                        holidayTitle={holiday?.title}
                        indicators={indicators}
                        forecast={
                          forecast && weather ? (
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
                          ) : (
                            <p className="calendar-day-tile__forecast-note">
                              {context.isLoading
                                ? 'Loading forecast…'
                                : weather?.status === 'unconfigured'
                                  ? 'Weather off'
                                  : weather?.data?.length
                                    ? 'No forecast yet'
                                    : 'Forecast unavailable'}
                            </p>
                          )
                        }
                      />
                    </li>
                  )
                })}
              </ol>
            </HorizontalScroll>
            {!warningFeed.isLoading && (warningView.unavailable || warningView.stale) && (
              <p className="weather-warnings-status" role="status">
                Weather warning updates are {warningView.unavailable ? 'unavailable' : 'delayed'}.{' '}
                <a
                  href="https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check the Met Office<span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </p>
            )}
            {travelFeed.isError && !travelFeed.data && (
              <p className="weather-warnings-status" role="status">
                TfL updates are unavailable.{' '}
                <a
                  href="https://tfl.gov.uk/tube-dlr-overground/status/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check TfL<span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </p>
            )}
          </>
        )}
        <HomeOverview entries={overview} />
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
              <Link className="week-planner__next" to={calendarEventPath(next)}>
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
              <Link className="week-planner__annual" to={calendarEventPath(annual)}>
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
