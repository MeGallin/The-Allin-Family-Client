import type { FoodAlertsFeed } from './types'

export const foodAlertLabels = {
  recall: 'Recall',
  allergy: 'Allergy alert',
  'food-alert': 'Food alert',
}

/** Both Home summaries use the same freshness rules, including offline expiry. */
export function foodAlertView(data: FoodAlertsFeed | undefined, isError: boolean, now: number) {
  const age = now - Date.parse(data?.updatedAt ?? '')
  const recent = Number.isFinite(age) && age >= -120000 && age <= 6 * 60 * 60 * 1000
  const alerts = recent ? (data?.data ?? []) : []
  return {
    alerts,
    unavailable: isError || !data || data.status === 'unavailable' || !recent,
    stale: data?.status === 'stale' || (isError && alerts.length > 0),
  }
}
