import { useMemories } from '../../../features/memories/useMemories'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { exactDate } from '../../../lib/friendly-dates'
import './MemoryActivity.css'
export function MemoryActivity() {
  const { activity } = useMemories()
  return (
    <details className="memory-activity">
      <summary>Recent memory activity</summary>
      <p className="note">The latest 100 changes. Older history stays in the database.</p>
      {activity.length ? (
        <ol>
          {activity.map((entry) => (
            <li key={entry.id}>
              <p>
                <strong>{entry.actor.displayName}</strong>{' '}
                {
                  {
                    created: 'shared',
                    edited: 'edited',
                    removed: 'removed',
                    liked: 'loved',
                    unliked: 'removed their love from',
                  }[entry.action]
                }{' '}
                “{entry.after?.title ?? entry.before?.title ?? 'a memory'}”.
              </p>
              <p className="note">
                <FriendlyTime value={entry.occurredAt} /> · {exactDate(entry.occurredAt)}
              </p>
              {entry.action === 'edited' && (
                <details>
                  <summary>What changed</summary>
                  {entry.before?.title !== entry.after?.title && (
                    <p>
                      Title: {entry.before?.title} → {entry.after?.title}
                    </p>
                  )}
                  {(entry.changes?.story ?? entry.before?.story !== entry.after?.story) && (
                    <p>The story was updated.</p>
                  )}
                  {(entry.changes?.photo ?? entry.before?.photoKey !== entry.after?.photoKey) && (
                    <p>The photo was changed.</p>
                  )}
                  <p>
                    Photo descriptions and all other saved details are included in the change
                    history.
                  </p>
                </details>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">No memories shared yet.</p>
      )}
    </details>
  )
}
