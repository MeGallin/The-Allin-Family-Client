import { useState } from 'react'
import { searchQuery } from '../lib/search'
import { useUrlFilters } from './useUrlFilters'
type RawFilters = { q: string; sort: string; show: string }
/** One collection filter contract. Private note text stays exclusively in component memory. */
export function useCollectionFilters<S extends string, F extends string = 'all'>({
  sort: readSort,
  filter: readFilter,
  storage = 'url',
  sortKey = 'sort',
}: {
  sort: (value: string | null) => S
  filter?: (value: string | null) => F
  storage?: 'url' | 'memory'
  sortKey?: 'sort' | 'show'
}) {
  const { params, update } = useUrlFilters()
  const [local, setLocal] = useState<RawFilters>({ q: '', sort: '', show: '' })
  const query = searchQuery(storage === 'memory' ? local.q : params.get('q'))
  const sort = readSort(storage === 'memory' ? local.sort : params.get(sortKey))
  const filter =
    readFilter?.(storage === 'memory' ? local.show : params.get('show')) ?? ('all' as const)
  function change(key: keyof RawFilters, value: string) {
    if (storage === 'memory') setLocal((current) => ({ ...current, [key]: value }))
    else update({ [key === 'sort' ? sortKey : key]: value }, { clearHash: true })
  }
  return {
    query,
    sort,
    filter,
    setQuery: (value: string) => change('q', searchQuery(value)),
    setSort: (value: string) => {
      const next = readSort(value)
      change('sort', next === readSort(null) ? '' : next)
    },
    setFilter: (value: string) => {
      const next = readFilter?.(value)
      if (next) change('show', next === readFilter?.(null) ? '' : next)
    },
    reset: () => {
      if (storage === 'memory') setLocal({ q: '', sort: '', show: '' })
      else update({}, { clear: ['q', sortKey, ...(readFilter ? ['show'] : [])], clearHash: true })
    },
  }
}
