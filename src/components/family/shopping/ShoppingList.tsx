import { Trash2, ShoppingBasket } from 'lucide-react'
import { useFamilyData } from '../../../features/family/useFamilyData'
import { Icon } from '../../ui/Icon'
import { EmptyState } from '../../ui/EmptyState'
import './ShoppingList.css'

export function ShoppingList({
  limit,
  removable = false,
}: {
  limit?: number
  removable?: boolean
}) {
  const { shopping, toggleShoppingItem, removeShoppingItem } = useFamilyData()
  if (shopping.length === 0)
    return (
      <EmptyState icon={ShoppingBasket} title="Nothing on the list">
        <p>Add what you need for the next shop.</p>
      </EmptyState>
    )
  return (
    <ul className="shopping-list">
      {shopping.slice(0, limit).map((item) => (
        <li key={item.id}>
          <label>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleShoppingItem(item.id)}
            />
            <span>{item.title}</span>
          </label>
          {removable && (
            <button
              type="button"
              className="icon-button"
              aria-label={'Remove ' + item.title}
              onClick={() => removeShoppingItem(item.id)}
            >
              <Icon icon={Trash2} />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
