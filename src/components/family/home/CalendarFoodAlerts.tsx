import { Link } from 'react-router'
import { TriangleAlert } from 'lucide-react'
import { useFoodAlerts } from '../../../features/food-alerts/useFoodAlerts'
import { foodAlertView } from '../../../features/food-alerts/food-alert-view'
import { useNow } from '../../../hooks/useNow'
import { Icon } from '../../ui/Icon'
import './CalendarFoodAlerts.css'

export function CalendarFoodAlerts() {
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
  return (
    <Link
      className={
        'calendar-food-alerts' + (alerts.length ? '' : ' calendar-food-alerts--unavailable')
      }
      to="/alerts"
      aria-label={'Latest food alerts: ' + description + '. Read the FSA notices.'}
      title={'Latest FSA food alerts · ' + description}
    >
      <span className="calendar-food-alerts__badge" aria-hidden="true">
        <Icon icon={TriangleAlert} />
        <span>{alerts.length || '!'}</span>
      </span>
    </Link>
  )
}
