import type { FamilyEvent } from '../../../features/calendar/types'
import { formatEventDay, formatEventTime, eventDate, dateInputValue } from '../../../lib/dates'
import { EventRow } from './EventRow'
import './EventList.css'

export function EventList({
  events,
  onEdit,
  disabled = false,
  blocks = false,
  compact = false,
  selectedId,
  selectedOccurrence,
}: {
  events: FamilyEvent[]
  onEdit?: (event: FamilyEvent) => void
  disabled?: boolean
  blocks?: boolean
  compact?: boolean
  selectedId?: string | null
  selectedOccurrence?: string | null
}) {
  return (
    <ul className={'event-list' + (blocks ? ' event-list--blocks' : '')}>
      {events.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          compact={compact}
          selected={
            event.id === selectedId && dateInputValue(eventDate(event)) === selectedOccurrence
          }
          onEdit={onEdit}
          disabled={disabled}
          day={formatEventDay(eventDate(event).toISOString())}
          time={event.allDay ? 'All day' : formatEventTime(event.startsAt)}
        />
      ))}
    </ul>
  )
}
