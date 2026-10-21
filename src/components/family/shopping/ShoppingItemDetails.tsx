import type { ShoppingItem } from '../../../features/shopping/types'
import './ShoppingItemDetails.css'
export function ShoppingItemDetails({ item }: { item: ShoppingItem }) {
  return (
    <dl id={'shopping-details-' + item.id} className="shopping-item-details">
      <div>
        <dt>Added by</dt>
        <dd>
          {item.createdBy.displayName}
          <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-GB')}</time>
        </dd>
      </div>
      {item.version > 1 && (
        <div>
          <dt>Last changed</dt>
          <dd>
            {item.updatedBy.displayName}
            <time dateTime={item.updatedAt}>
              {new Date(item.updatedAt).toLocaleString('en-GB')}
            </time>
          </dd>
        </div>
      )}
    </dl>
  )
}
