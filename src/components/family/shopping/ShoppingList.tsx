import { useCallback, useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import { useShopping } from '../../../features/shopping/useShopping'
import { LoadingState } from '../../ui/LoadingState'
import { ShoppingRow } from './ShoppingRow'
import { EmptyState } from '../../ui/EmptyState'
import './ShoppingList.css'
import type { ShoppingItem } from '../../../features/shopping/types'

export function ShoppingList({
  limit,
  removable = false,
  view,
  onReset,
}: {
  limit?: number
  removable?: boolean
  view?: ShoppingItem[]
  onReset?: () => void
}) {
  const { items: shopping, loading, error, pending, refresh } = useShopping()
  const [editingRows, setEditingRows] = useState<Record<string, ShoppingItem>>({})
  const trackEditing = useCallback((id: string, item: ShoppingItem | null) => {
    setEditingRows((previous) => {
      const next = { ...previous }
      if (item) next[id] = item
      else delete next[id]
      return next
    })
  }, [])
  const displayed = (view ?? shopping).slice(0, limit)
  const retained = Object.values(editingRows).filter(
    (item) => !displayed.some((row) => row.id === item.id),
  )
  const rows = [
    ...displayed,
    ...retained.map((item) => shopping.find((row) => row.id === item.id) ?? item),
  ]
  if (loading && rows.length === 0) return <LoadingState label="Loading the shared list…" />
  if (error && rows.length === 0)
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
  if (rows.length === 0 && shopping.length === 0)
    return (
      <EmptyState icon={ShoppingBasket} title="Nothing on the list">
        <p>Add what you need for the next shop.</p>
      </EmptyState>
    )
  if (view && rows.length === 0)
    return (
      <EmptyState icon={ShoppingBasket} title="No matching items">
        <p>Try another name or reset your view.</p>
        {onReset && (
          <button type="button" className="button-link" onClick={onReset}>
            Reset view
          </button>
        )}
      </EmptyState>
    )
  return (
    <ul className="shopping-list">
      {rows.map((item) => (
        <ShoppingRow
          key={item.id}
          item={item}
          editable={removable}
          disabled={pending}
          missing={!shopping.some((row) => row.id === item.id)}
          onEditingChange={trackEditing}
        />
      ))}
    </ul>
  )
}
