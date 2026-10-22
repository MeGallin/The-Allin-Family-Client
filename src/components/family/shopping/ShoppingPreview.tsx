import { Link } from 'react-router'
import { CheckCheck } from 'lucide-react'
import { useShopping } from '../../../features/shopping/useShopping'
import { shoppingView } from '../../../features/shopping/shopping-view'
import { Panel } from '../../ui/Panel'
import { Icon } from '../../ui/Icon'
import { ShoppingList } from './ShoppingList'
import './ShoppingPreview.css'

export function ShoppingPreview() {
  const { items: shopping, loading, error, feedback, refresh, pending } = useShopping()
  const needed = shoppingView(shopping, '', 'priority', 'needed')
  const remaining = needed.length
  return (
    <Panel title="Shopping" action={<Link to="/lists">Open list</Link>}>
      {error && shopping.length > 0 && (
        <div>
          <p className="error" role="alert">
            {error}
          </p>
          <button type="button" className="secondary" disabled={pending} onClick={refresh}>
            Try again
          </button>
        </div>
      )}
      {!loading && remaining === 0 && (!error || shopping.length > 0) ? (
        <p className="shopping-preview__settled">
          <Icon icon={CheckCheck} />
          <span>
            <strong>
              {error
                ? 'Saved list: all picked up'
                : shopping.length
                  ? 'All picked up'
                  : 'Nothing on the list yet'}
            </strong>
            <Link to="/lists">Add something for the next shop</Link>
          </span>
        </p>
      ) : (
        <>
          {remaining > 0 && (
            <p className="shopping-preview__count">{remaining} to get · important items first</p>
          )}
          <ShoppingList limit={3} view={needed} />
        </>
      )}
      {feedback && (
        <p className="note" role="status">
          {feedback}
        </p>
      )}
      {remaining > 3 && (
        <p className="shopping-preview__more">
          <Link to="/lists?show=needed">See {remaining - 3} more to pick up</Link>
        </p>
      )}
    </Panel>
  )
}
