import { useShopping } from '../../../features/shopping/useShopping'
import './ShoppingActivity.css'
import { FriendlyTime } from '../../ui/FriendlyTime'

const verbs = {
  created: 'added',
  edited: 'updated',
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
                {event.action === 'edited' && event.before?.title !== event.after?.title && (
                  <> to “{event.after?.title}”</>
                )}
                .{event.action === 'created' && event.after?.important && ' Marked important.'}
                {event.action === 'edited' &&
                  !!event.before?.important !== !!event.after?.important &&
                  (event.after?.important ? ' Marked important.' : ' No longer marked important.')}
              </p>
              <FriendlyTime value={event.occurredAt} showExact />
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">Changes will appear here when someone adds an item.</p>
      )}
    </details>
  )
}
