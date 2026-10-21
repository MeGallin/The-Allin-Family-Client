import { useRemovals } from '../../../features/removals/useRemovals'
import { RemovalNotice } from '../../removals/RemovalNotice'
import type { FamilyEvent } from '../../../features/calendar/types'
import './EventRow.css'
import { eventDate } from '../../../lib/dates'
import { EventCountdown } from './EventCountdown'
import { exactDate } from '../../../lib/friendly-dates'
import { FriendlyTime } from '../../ui/FriendlyTime'

export function EventRow({
  event,
  onEdit,
  disabled,
  day,
  time,
}: {
  event: FamilyEvent
  onEdit?: (event: FamilyEvent) => void
  disabled: boolean
  day: string
  time: string
}) {
  const { removals } = useRemovals('calendar')
  const removal = removals[event.id]
  const date = eventDate(event)
  return (
    <li className="event-row">
      <div className="event-list__date" aria-hidden="true">
        <span>{new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date)}</span>
        <strong>{date.getDate()}</strong>
        <span className="event-row__month">
          {new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date)}
        </span>
      </div>
      <div className="event-list__detail">
        <h3>{event.title}</h3>
        <p>
          <EventCountdown event={event} />
        </p>
        {event.annually && <p className="event-row__credit">Repeats every year</p>}
        <p>
          <time dateTime={event.occursAt ?? event.startsAt}>
            {day} · {time}
          </time>
        </p>
        {event.detail && <p className="event-row__notes">{event.detail}</p>}
        <p className="event-row__credit">
          {event.version === 1
            ? 'Added by ' + event.createdBy.displayName
            : event.createdBy.id === event.updatedBy.id
              ? 'Added & updated by ' + event.createdBy.displayName
              : event.createdBy.displayName +
                ' added · ' +
                event.updatedBy.displayName +
                ' updated'}
          {' · '}
          <FriendlyTime value={event.version > 1 ? event.updatedAt : event.createdAt} />
        </p>
        <RemovalNotice removal={removal} />
        {onEdit && (
          <div className="event-row__controls">
            <button
              type="button"
              id={'calendar-remove-' + event.id}
              className="button-link"
              disabled={disabled || !!removal}
              onClick={() => onEdit(event)}
              aria-label={'Edit ' + event.title}
            >
              Edit event
            </button>
            <details className="event-row__details">
              <summary>Event details</summary>
              <dl>
                <dt>Added by</dt>
                <dd>
                  {event.createdBy.displayName} ·{' '}
                  <time dateTime={event.createdAt}>{exactDate(event.createdAt)}</time>
                </dd>
                {event.version > 1 && (
                  <>
                    <dt>Last changed by</dt>
                    <dd>
                      {event.updatedBy.displayName} ·{' '}
                      <time dateTime={event.updatedAt}>{exactDate(event.updatedAt)}</time>
                    </dd>
                  </>
                )}
                <dt>{event.annually ? 'Next occurrence' : 'Original event time'}</dt>
                <dd>
                  {event.allDay
                    ? day + ' · All day'
                    : new Intl.DateTimeFormat('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: event.timeZone,
                      }).format(date)}{' '}
                  {!event.allDay && ' (' + event.timeZone + ')'}
                </dd>
              </dl>
            </details>
          </div>
        )}
      </div>
    </li>
  )
}
