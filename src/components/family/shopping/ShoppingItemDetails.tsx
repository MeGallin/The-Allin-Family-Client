import type { ShoppingItem } from '../../../features/shopping/types'
import './ShoppingItemDetails.css'
import { exactDate } from '../../../lib/friendly-dates'
export function ShoppingItemDetails({ item }: { item: ShoppingItem }) {
  return (
    <dl id={'shopping-details-' + item.id} className="shopping-item-details">
      <div>
        <dt>Priority</dt>
        <dd>{item.important ? 'Important' : 'Standard'}</dd>
      </div>
      <div>
        <dt>Added by</dt>
        <dd>
          {item.createdBy.displayName}
          <time dateTime={item.createdAt}>{exactDate(item.createdAt)}</time>
        </dd>
      </div>
      {item.version > 1 && (
        <div>
          <dt>Last changed</dt>
          <dd>
            {item.updatedBy.displayName}
            <time dateTime={item.updatedAt}>{exactDate(item.updatedAt)}</time>
          </dd>
        </div>
      )}
    </dl>
  )
}
