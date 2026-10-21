import { Link } from 'react-router'
import { CalendarDays } from 'lucide-react'
import { useCalendar } from '../../../features/calendar/useCalendar'
import { LoadingState } from '../../ui/LoadingState'
import { formatEventDay, formatEventTime, upcomingEvents, eventDate } from '../../../lib/dates'
import { EmptyState } from '../../ui/EmptyState'
import { Panel } from '../../ui/Panel'
import { EventList } from './EventList'
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
      {loading ? (
        <LoadingState label="Loading family plans…" />
      ) : error ? (
        <p className="error" role="alert">
          {error}{' '}
          <button type="button" className="button-link" onClick={refresh}>
            Try again
          </button>
        </p>
      ) : next ? (
        <>
          <div className="upcoming-plans__next">
            <p>Next up</p>
            <h3>{next.title}</h3>
            <p>
              <EventCountdown event={next} />
            </p>
            {next.annually && <p>Repeats every year</p>}
            <p>Added by {next.createdBy.displayName}</p>
            <p>
              <time dateTime={next.occursAt ?? next.startsAt}>
                {formatEventDay(eventDate(next).toISOString())} ·{' '}
                {next.allDay ? 'All day' : formatEventTime(next.startsAt)}
              </time>
            </p>
          </div>
          <EventList events={upcoming.slice(1, 3)} />
        </>
      ) : (
        <EmptyState icon={CalendarDays} title="A little space in the diary">
          <p>Add a plan and bring everyone together.</p>
        </EmptyState>
      )}
    </Panel>
  )
}
