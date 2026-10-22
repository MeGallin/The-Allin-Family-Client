import { useUrlFilters } from '../../hooks/useUrlFilters'

export function adminPeriod(value: string | null, allowAll = false) {
  return value && (['7', '30', '90'].includes(value) || (allowAll && value === '0')) ? value : '30'
}

/** Reporting keeps its own period policy, using the common atomic URL updates. */
export function useAdminFilters(allowAll = false) {
  const { params, update } = useUrlFilters({ replace: false })
  const setFilter = (key: 'days' | 'user' | 'type' | 'actor' | 'before', value: string) =>
    update({ [key]: value }, { clear: key === 'before' ? [] : ['before'] })
  return { params, days: adminPeriod(params.get('days'), allowAll), setFilter }
}
