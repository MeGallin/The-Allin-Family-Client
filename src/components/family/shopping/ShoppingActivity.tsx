import { useShopping } from '../../../features/shopping/useShopping'
import './ShoppingActivity.css'

const verbs = {
  created: 'added',
  edited: 'renamed',
  checked: 'picked up',
  unchecked: 'put back on the list',
  removed: 'removed',
}
export function ShoppingActivity() {
  const { activity } = useShopping()
  return (
    <details className="shopping-activity">
      <summary>Recent list activity</summary>
      <p className="note">The latest 100 changes. Older history stays in the database.</p>
      {activity.length ? (
        <ol>
          {activity.map((event) => (
            <li key={event.id}>
              <p>
                <strong>{event.actor.displayName}</strong> {verbs[event.action]} “
                {event.before?.title ?? event.after?.title}”
                {event.action === 'edited' && <> to “{event.after?.title}”</>}.
              </p>
              <time dateTime={event.occurredAt}>
                {new Date(event.occurredAt).toLocaleString('en-GB')}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">Changes will appear here when someone adds an item.</p>
      )}
    </details>
  )
}
