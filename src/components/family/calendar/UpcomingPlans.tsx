import { Link } from 'react-router'
import { CalendarDays } from 'lucide-react'
import { useCalendar } from '../../../features/calendar/useCalendar'
import { LoadingState } from '../../ui/LoadingState'
import { formatEventDay, formatEventTime, upcomingEvents, eventDate } from '../../../lib/dates'
import { EmptyState } from '../../ui/EmptyState'
import { Panel } from '../../ui/Panel'
import './UpcomingPlans.css'
import { EventCountdown } from './EventCountdown'
import { useNow } from '../../../hooks/useNow'

export function UpcomingPlans() {
  const { events, loading, error, refresh } = useCalendar()
  const upcoming = upcomingEvents(events, useNow())
  const next = upcoming[0]
  return (
    <Panel
      title="Coming up"
      action={<Link to="/calendar">View calendar</Link>}
      className="upcoming-plans"
    >
      {loading ? <LoadingState label="Loading family plans…" /> : null}
      {error && (
        <p className="error" role="alert">
          {error}{' '}
          <button type="button" className="button-link" onClick={refresh}>
            Try again
          </button>
        </p>
      )}
      {!loading && next ? (
        <>
          <div className="upcoming-plans__next">
            <div className="upcoming-plans__date" aria-hidden="true">
              <strong>{eventDate(next).getDate()}</strong>
              <span>
                {new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(eventDate(next))}
              </span>
            </div>
            <div className="upcoming-plans__headline">
              <h3>{next.title}</h3>
              <p>
                <EventCountdown event={next} />
              </p>
              <p className="upcoming-plans__credit">
                {next.annually ? 'Every year · ' : ''}Added by {next.createdBy.displayName}
              </p>
              <p>
                <time dateTime={next.occursAt ?? next.startsAt}>
                  {formatEventDay(eventDate(next).toISOString())} ·{' '}
                  {next.allDay ? 'All day' : formatEventTime(next.startsAt)}
                </time>
              </p>
            </div>
          </div>
          {upcoming.length > 1 && (
            <p className="upcoming-plans__more">
              <Link to="/calendar">
                See {upcoming.length - 1} more upcoming {upcoming.length === 2 ? 'plan' : 'plans'}
              </Link>
            </p>
          )}
        </>
      ) : (
        !loading &&
        !error && (
          <EmptyState icon={CalendarDays} title="A little space in the diary">
            <p>
              <Link to="/calendar?compose=event">Add a plan</Link> and bring everyone together.
            </p>
          </EmptyState>
        )
      )}
    </Panel>
  )
}
