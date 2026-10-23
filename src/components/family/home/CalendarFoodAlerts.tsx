import { lazy } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useFoodAlerts } from '../../../features/food-alerts/useFoodAlerts'
import { foodAlertView } from '../../../features/food-alerts/food-alert-view'
import { useNow } from '../../../hooks/useNow'
import { IndicatorStrip, type CalendarIndicator } from '../../ui/IndicatorStrip'

const FoodAlerts = lazy(() =>
  import('../alerts/FoodAlerts').then((module) => ({ default: module.FoodAlerts })),
)

export function useFoodCalendarIndicator(): CalendarIndicator | null {
  const { data, isLoading, isError } = useFoodAlerts()
  const { alerts, unavailable, stale } = foodAlertView(data, isError, useNow())
  if (isLoading || (!unavailable && alerts.length === 0)) return null
  const counts = alerts.reduce(
    (result, alert) => {
      result[alert.kind]++
      return result
    },
    { allergy: 0, recall: 0, 'food-alert': 0 },
  )
  const summary = [
    counts.allergy ? `${counts.allergy} allergy ${counts.allergy === 1 ? 'alert' : 'alerts'}` : '',
    counts.recall ? `${counts.recall} ${counts.recall === 1 ? 'recall' : 'recalls'}` : '',
    counts['food-alert']
      ? `${counts['food-alert']} food ${counts['food-alert'] === 1 ? 'notice' : 'notices'}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const description =
    (summary || 'Check the latest FSA advice') +
    (stale ? ' · updates delayed' : unavailable ? ' · updates unavailable' : '')
  return {
    id: 'food',
    label: alerts.length ? 'Food ' + alerts.length : 'Food !',
    compactLabel: String(alerts.length || '!'),
    accessibleLabel: 'Latest food alerts: ' + description + '. Read the FSA notices.',
    description,
    source: 'FSA food alerts',
    icon: ShieldAlert,
    tone: alerts.length ? 'error' : 'muted',
    priority: 4,
    dialogTitle: 'Latest food alerts',
    details: () => <FoodAlerts />,
  }
}

export function CalendarFoodAlerts() {
  const indicator = useFoodCalendarIndicator()
  return indicator ? <IndicatorStrip indicators={[indicator]} dayLabel="today" /> : null
}
