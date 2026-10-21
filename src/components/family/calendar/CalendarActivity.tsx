import { useCalendar } from '../../../features/calendar/useCalendar'
import './CalendarActivity.css'
import { eventDate, formatEventDay, formatEventTime } from '../../../lib/dates'
import type { EventDraft } from '../../../features/calendar/types'
import { FriendlyTime } from '../../ui/FriendlyTime'
const when = (event: EventDraft) =>
  formatEventDay(eventDate(event).toISOString()) +
  ' · ' +
  (event.allDay ? 'All day' : formatEventTime(event.startsAt)) +
  (event.annually ? ' · Every year' : '')
export function CalendarActivity() {
  const { activity } = useCalendar()
  return (
    <details className="calendar-activity">
      <summary>Recent calendar activity</summary>
      {activity.length ? (
        <ol>
          {activity.map((entry) => (
            <li key={entry.id}>
              <p>
                <strong>{entry.actor.displayName}</strong>{' '}
                {entry.action === 'created' ? 'added' : entry.action}{' '}
                <span>{(entry.after ?? entry.before)?.title ?? 'an event'}</span>
              </p>
              <FriendlyTime value={entry.occurredAt} showExact />
              {entry.action === 'edited' && (
                <details>
                  <summary>View changes</summary>
                  <dl>
                    <dt>Before</dt>
                    <dd>
                      {entry.before?.title} · {entry.before && when(entry.before)}
                      <p>{entry.before?.detail}</p>
                    </dd>
                    <dt>After</dt>
                    <dd>
                      {entry.after?.title} · {entry.after && when(entry.after)}
                      <p>{entry.after?.detail}</p>
                    </dd>
                  </dl>
                </details>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">No calendar changes yet.</p>
      )}
    </details>
  )
}
