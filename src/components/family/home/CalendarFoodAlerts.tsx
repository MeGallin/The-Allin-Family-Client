import { lazy, Suspense, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useFoodAlerts } from '../../../features/food-alerts/useFoodAlerts'
import { foodAlertView } from '../../../features/food-alerts/food-alert-view'
import { useNow } from '../../../hooks/useNow'
import { Icon } from '../../ui/Icon'
import { Modal } from '../../ui/Modal'
import { LoadingState } from '../../ui/LoadingState'
import './CalendarFoodAlerts.css'

const FoodAlerts = lazy(() =>
  import('../alerts/FoodAlerts').then((module) => ({ default: module.FoodAlerts })),
)

export function CalendarFoodAlerts() {
  const [open, setOpen] = useState(false)
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
    <>
      <button
        type="button"
        className={
          'calendar-food-alerts' + (alerts.length ? '' : ' calendar-food-alerts--unavailable')
        }
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={'Latest food alerts: ' + description + '. Read the FSA notices.'}
        title={'Latest FSA food alerts · ' + description}
      >
        <span className="calendar-food-alerts__badge" aria-hidden="true">
          <Icon icon={TriangleAlert} />
          <span>{alerts.length || '!'}</span>
        </span>
      </button>
      {open && (
        <Modal
          title="Latest food alerts"
          onClose={() => setOpen(false)}
          className="food-alerts-dialog"
        >
          <Suspense fallback={<LoadingState label="Loading food alerts…" />}>
            <FoodAlerts />
          </Suspense>
        </Modal>
      )}
    </>
  )
}
