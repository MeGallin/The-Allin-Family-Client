import { useId } from 'react'
import { ViewControls } from '../../ui/ViewControls'
import {
  shoppingSorts,
  shoppingFilters,
  type ShoppingSort,
  type ShoppingFilter,
} from '../../../features/shopping/shopping-view'
export function ShoppingControls({
  query,
  sort,
  filter,
  onQuery,
  onSort,
  onFilter,
  onReset,
  count,
  total,
}: {
  query: string
  sort: ShoppingSort
  filter: ShoppingFilter
  onQuery: (value: string) => void
  onSort: (value: string) => void
  onFilter: (value: string) => void
  onReset: () => void
  count: number
  total: number
}) {
  const id = useId()
  return (
    <ViewControls
      label="Shopping filters and sorting"
      queryLabel="Name or item"
      placeholder="e.g. Milk or Dad"
      hint="Search item names or who added/edited them."
      query={query}
      sort={sort}
      options={shoppingSorts}
      onQuery={onQuery}
      onSort={onSort}
      onReset={onReset}
      active={!!query || sort !== 'priority' || filter !== 'all'}
      count={count}
      total={total}
      noun="item"
      extra={
        <div>
          <label htmlFor={id}>Show</label>
          <select id={id} value={filter} onChange={(e) => onFilter(e.target.value)}>
            {shoppingFilters.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      }
    />
  )
}
