import { Link } from 'react-router'
import { CheckCheck } from 'lucide-react'
import { useShopping } from '../../../features/shopping/useShopping'
import { shoppingView } from '../../../features/shopping/shopping-view'
import { Panel } from '../../ui/Panel'
import { EmptyState } from '../../ui/EmptyState'
import { ShoppingList } from './ShoppingList'
import './ShoppingPreview.css'

export function ShoppingPreview() {
  const { items: shopping, loading, error, feedback, refresh, pending } = useShopping()
  const remaining = shopping.filter((item) => !item.checked).length
  const needed = shoppingView(shopping, '', 'priority', 'needed')
  return (
    <Panel title="Pick up on the way" action={<Link to="/lists">Open list</Link>}>
      <p className="shopping-preview__count" role="status">
        {loading
          ? 'Connecting…'
          : error
            ? 'Check the shared list connection'
            : shopping.length === 0
              ? 'Nothing to get yet'
              : remaining
                ? remaining + ' to get'
                : '1 shared list · Up to date'}
      </p>
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
      {!loading && shopping.length > 0 && remaining === 0 ? (
        <EmptyState icon={CheckCheck} title="All picked up">
          <p>The shared list is sorted. Add anything else you need.</p>
          <Link to="/lists">Review the shopping list</Link>
        </EmptyState>
      ) : (
        <ShoppingList limit={3} view={needed} />
      )}
      <p className="note" role="status">
        {feedback}
      </p>
      {remaining > 3 && (
        <p className="shopping-preview__more">
          <Link to="/lists?show=needed">See {remaining - 3} more to pick up</Link>
        </p>
      )}
    </Panel>
  )
}
