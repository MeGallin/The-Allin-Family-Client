import { createSearchMatcher, filterOption } from '../../lib/search'
import type { ShoppingItem } from './types'
export const shoppingSorts = [
  ['priority', 'Important first'],
  ['newest', 'Newest added'],
  ['oldest', 'Oldest added'],
  ['name', 'Name A–Z'],
  ['name-desc', 'Name Z–A'],
  ['updated', 'Recently edited'],
] as const
export const shoppingFilters = [
  ['all', 'All items'],
  ['needed', 'Still to get'],
  ['picked', 'Picked up'],
  ['important', 'Important'],
  ['standard', 'Standard priority'],
] as const
export type ShoppingSort = (typeof shoppingSorts)[number][0]
export type ShoppingFilter = (typeof shoppingFilters)[number][0]
export function shoppingSort(value: string | null): ShoppingSort {
  return filterOption(value, shoppingSorts, 'priority')
}
export function shoppingFilter(value: string | null): ShoppingFilter {
  return filterOption(value, shoppingFilters, 'all')
}
export function shoppingView(
  items: ShoppingItem[],
  query: string,
  sort: ShoppingSort,
  filter: ShoppingFilter,
): ShoppingItem[] {
  const matches = createSearchMatcher(query)
  return items
    .filter(
      (item) =>
        matches([item.title, item.createdBy.displayName, item.updatedBy.displayName]) &&
        (filter === 'all' ||
          (filter === 'needed' && !item.checked) ||
          (filter === 'picked' && item.checked) ||
          (filter === 'important' && item.important) ||
          (filter === 'standard' && !item.important)),
    )
    .sort((a, b) => {
      let result = 0
      if (sort === 'priority')
        result =
          Number(b.important) - Number(a.important) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt)
      if (sort === 'newest' || sort === 'oldest')
        result = (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * (sort === 'newest' ? -1 : 1)
      if (sort === 'updated') result = Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      if (sort === 'name' || sort === 'name-desc')
        result =
          a.title.localeCompare(b.title, 'en-GB', { sensitivity: 'base', numeric: true }) *
          (sort === 'name-desc' ? -1 : 1)
      return result || b.id.localeCompare(a.id, 'en-GB', { numeric: true })
    })
}
