import { ArrowUpRight, ShieldAlert } from 'lucide-react'
import { useFoodAlerts } from '../../../features/food-alerts/useFoodAlerts'
import { useNow } from '../../../hooks/useNow'
import { foodAlertView } from '../../../features/food-alerts/food-alert-view'
import { FoodAlertItem } from './FoodAlertItem'
import { Panel } from '../../ui/Panel'
import { Icon } from '../../ui/Icon'
import { FriendlyTime } from '../../ui/FriendlyTime'
import './FoodAlerts.css'

const allAlerts = 'https://www.food.gov.uk/news-alerts/search/alerts'

/** First feed on the Alerts route; keep provider details separate from Home. */
export function FoodAlerts() {
  const { data, isLoading, isError, refetch, isFetching } = useFoodAlerts()
  const { alerts, unavailable, stale } = foodAlertView(data, isError, useNow())
  return (
    <Panel
      title="Food alerts"
      id="food-alerts"
      tabIndex={-1}
      variant="plain"
      className="food-alerts"
      action={
        <a href={allAlerts} target="_blank" rel="noopener noreferrer">
          View all alerts <Icon icon={ArrowUpRight} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      }
    >
      <p className="food-alerts__source">
        <Icon icon={ShieldAlert} /> From the Food Standards Agency
      </p>
      {isLoading ? (
        <p className="food-alerts__message" role="status">
          Checking the latest food alerts…
        </p>
      ) : (
        <>
          {(unavailable || stale) && (
            <p className="food-alerts__message" role="status">
              {alerts?.length
                ? 'Updates are temporarily unavailable. These notices were last checked earlier; check the FSA for the latest advice.'
                : 'Food alerts are temporarily unavailable. Check the FSA for the latest advice.'}{' '}
              <button
                type="button"
                className="text-button food-alerts__retry"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching ? 'Checking…' : 'Try again'}
              </button>
            </p>
          )}
          {!!alerts?.length && (
            <ul className="food-alerts__list">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <FoodAlertItem alert={alert} />
                </li>
              ))}
            </ul>
          )}
          {!unavailable && !alerts?.length && (
            <p className="food-alerts__message">
              No notices returned by the FSA. View all alerts for official advice.
            </p>
          )}
        </>
      )}
      {data?.updatedAt && (
        <p className="food-alerts__checked">
          Last checked <FriendlyTime value={data.updatedAt} />
          {stale && ' · updates delayed'}
        </p>
      )}
    </Panel>
  )
}
