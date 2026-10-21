import { useSearchParams } from 'react-router'

export function adminPeriod(value: string | null, allowAll = false) {
  return value && (['7', '30', '90'].includes(value) || (allowAll && value === '0')) ? value : '30'
}

/** One URL filter contract for admin views, browser Back and shareable drill-downs. */
export function useAdminFilters(allowAll = false) {
  const [params, setParams] = useSearchParams()
  const setFilter = (key: 'days' | 'user' | 'type' | 'actor' | 'before', value: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'before') next.delete('before')
      return next
    })
  }
  return { params, days: adminPeriod(params.get('days'), allowAll), setFilter }
}
