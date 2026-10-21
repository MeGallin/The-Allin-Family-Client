import { ShoppingBasket } from 'lucide-react'
import { useShopping } from '../../../features/shopping/useShopping'
import { LoadingState } from '../../ui/LoadingState'
import { ShoppingRow } from './ShoppingRow'
import { EmptyState } from '../../ui/EmptyState'
import './ShoppingList.css'

export function ShoppingList({
  limit,
  removable = false,
}: {
  limit?: number
  removable?: boolean
}) {
  const { items: shopping, loading, error, pending, refresh } = useShopping()
  if (loading) return <LoadingState label="Loading the shared list…" />
  if (error && shopping.length === 0)
    return (
      <div>
        <p className="error" role="alert">
          {error}
        </p>
        <button type="button" className="secondary" onClick={refresh}>
          Try again
        </button>
      </div>
    )
  if (shopping.length === 0)
    return (
      <EmptyState icon={ShoppingBasket} title="Nothing on the list">
        <p>Add what you need for the next shop.</p>
      </EmptyState>
    )
  return (
    <ul className="shopping-list">
      {shopping.slice(0, limit).map((item) => (
        <ShoppingRow key={item.id} item={item} editable={removable} disabled={pending} />
      ))}
    </ul>
  )
}
