import { Link } from 'react-router'
import { useShopping } from '../../../features/shopping/useShopping'
import { Panel } from '../../ui/Panel'
import { ShoppingList } from './ShoppingList'
import './ShoppingPreview.css'

export function ShoppingPreview() {
  const { items: shopping, loading, error, feedback } = useShopping()
  const remaining = shopping.filter((item) => !item.checked).length
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
                : 'All picked up'}
      </p>
      {error && shopping.length > 0 && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <ShoppingList limit={3} />
      <p className="note" role="status">
        {feedback}
      </p>
      {shopping.length > 3 && (
        <p className="shopping-preview__more">And {shopping.length - 3} more on the list.</p>
      )}
    </Panel>
  )
}
