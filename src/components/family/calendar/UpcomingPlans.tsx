import { Link } from 'react-router'
import { CalendarDays } from 'lucide-react'
import { useFamilyData } from '../../../features/family/useFamilyData'
import { formatEventDay, formatEventTime, upcomingEvents } from '../../../lib/dates'
import { EmptyState } from '../../ui/EmptyState'
import { Panel } from '../../ui/Panel'
import { EventList } from './EventList'
import './UpcomingPlans.css'

export function UpcomingPlans() {
  const { events } = useFamilyData()
  const upcoming = upcomingEvents(events)
  const next = upcoming[0]
  return (
    <Panel
      title="Coming up"
      action={<Link to="/calendar">View calendar</Link>}
      className="upcoming-plans"
    >
      {next ? (
        <>
          <div className="upcoming-plans__next">
            <p>Next up</p>
            <h3>{next.title}</h3>
            <p>
              <time dateTime={next.startsAt}>
                {formatEventDay(next.startsAt)} · {formatEventTime(next.startsAt)}
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
