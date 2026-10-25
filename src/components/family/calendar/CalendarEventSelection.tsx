import { format } from 'date-fns'
import { Link } from 'react-router'
import { Modal } from '../../ui/Modal'
import type { FamilyEvent } from '../../../features/calendar/types'
import { eventDate } from '../../../lib/dates'
import './CalendarEventSelection.css'
import { RemovalNotice } from '../../removals/RemovalNotice'
import type { PendingRemoval } from '../../../features/removals/removals-slice'

export function CalendarEventSelection({
  event,
  reason,
  unavailable,
  onClose,
  onEdit,
  onCalendar,
  editDisabled,
  removal,
  outsideResults,
}: {
  event: FamilyEvent | null
  reason: string
  unavailable: boolean
  onClose: () => void
  onEdit: (event: FamilyEvent) => void
  onCalendar: () => void
  editDisabled: boolean
  removal?: PendingRemoval
  outsideResults: boolean
}) {
  return (
    <Modal
      title={event?.title ?? 'Selected calendar event'}
      onClose={onClose}
      scrollable
      className="calendar-selection"
    >
      {unavailable ? (
        <p role="alert">Calendar details are unavailable. Refresh the calendar to try again.</p>
      ) : (
        <>
          {reason && (
            <p className="note" role="status">
              {reason}
            </p>
          )}
          {event && (
            <>
              {outsideResults && (
                <p className="note">
                  This selected event or occurrence is outside the current results. Open calendar
                  below to clear the selection and filters.
                </p>
              )}
              <RemovalNotice removal={removal} />
              <p>
                <time dateTime={event.occursAt ?? event.startsAt}>
                  {format(eventDate(event), 'EEEE d MMMM yyyy')} ·{' '}
                  {event.allDay ? 'All day' : format(eventDate(event), 'HH:mm')}
                </time>
              </p>
              <p className="note">
                {event.allDay
                  ? 'Saved all-day date'
                  : `Times shown in ${Intl.DateTimeFormat().resolvedOptions().timeZone} · Saved zone ${event.timeZone}`}
                {event.annually ? ' · Annual occurrence' : ''}
              </p>
              {event.detail && <p className="calendar-selection__note">{event.detail}</p>}
              <p className="note">Read-only details · Event reference {event.id}</p>
            </>
          )}
          <div className="calendar-selection__actions">
            {event && (
              <button type="button" disabled={editDisabled} onClick={() => onEdit(event)}>
                Edit this event
              </button>
            )}
            {event && (
              <Link to={'/calendar?' + new URLSearchParams({ q: event.title }).toString()}>
                Find similar titles
              </Link>
            )}
            <button type="button" className="secondary" onClick={onCalendar}>
              Open calendar
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
