import type { FamilyEvent } from '../../../features/family/types'
import { formatEventDay, formatEventTime } from '../../../lib/dates'
import './EventList.css'

export function EventList({ events }: { events: FamilyEvent[] }) {
  return (
    <ul className="event-list">
      {events.map((event) => {
        const date = new Date(event.startsAt)
        return (
          <li key={event.id}>
            <div className="event-list__date" aria-hidden="true">
              <span>{new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date)}</span>
              <strong>{date.getDate()}</strong>
            </div>
            <div className="event-list__detail">
              <h3>{event.title}</h3>
              <p>
                <time dateTime={event.startsAt}>
                  {formatEventDay(event.startsAt)} · {formatEventTime(event.startsAt)}
                </time>
              </p>
              <p>{event.detail}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
