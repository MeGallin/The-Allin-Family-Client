import type { FamilyEvent } from '../../../features/calendar/types'
import { formatEventDay, formatEventTime, eventDate } from '../../../lib/dates'
import { EventRow } from './EventRow'
import './EventList.css'

export function EventList({
  events,
  onEdit,
  disabled = false,
  blocks = false,
}: {
  events: FamilyEvent[]
  onEdit?: (event: FamilyEvent) => void
  disabled?: boolean
  blocks?: boolean
}) {
  return (
    <ul className={'event-list' + (blocks ? ' event-list--blocks' : '')}>
      {events.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          onEdit={onEdit}
          disabled={disabled}
          day={formatEventDay(eventDate(event).toISOString())}
          time={event.allDay ? 'All day' : formatEventTime(event.startsAt)}
        />
      ))}
    </ul>
  )
}
