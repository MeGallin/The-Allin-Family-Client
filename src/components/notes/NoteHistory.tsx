import type { NoteActivity } from '../../features/notes/types'
import { FriendlyTime } from '../ui/FriendlyTime'
import { exactDate } from '../../lib/friendly-dates'
import './NoteHistory.css'
export function NoteHistory({ activity }: { activity: NoteActivity[] }) {
  return (
    <details className="note-history">
      <summary>Your private note activity</summary>
      <p className="note">Your latest 50 changes. This history is visible only to you.</p>
      {activity.length ? (
        <ol>
          {activity.map((entry) => (
            <li key={entry.id}>
              <p>
                You {{ created: 'created', edited: 'edited', removed: 'deleted' }[entry.action]} “
                {entry.after?.title ?? entry.before?.title}”.
              </p>
              <p className="note">
                <FriendlyTime value={entry.occurredAt} /> · {exactDate(entry.occurredAt)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">No notes saved yet.</p>
      )}
    </details>
  )
}
