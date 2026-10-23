import { ArrowUpRight, ShieldAlert } from 'lucide-react'
import { useId } from 'react'
import { useFoodAlerts } from '../../../features/food-alerts/useFoodAlerts'
import { useNow } from '../../../hooks/useNow'
import { foodAlertView } from '../../../features/food-alerts/food-alert-view'
import { FoodAlertItem, FoodAlertSummary } from './FoodAlertItem'
import { Accordion } from '../../ui/Accordion'
import { Icon } from '../../ui/Icon'
import { FriendlyTime } from '../../ui/FriendlyTime'
import './FoodAlerts.css'

const allAlerts = 'https://www.food.gov.uk/news-alerts/search/alerts'

/** Shared FSA notice content, loaded on demand inside the calendar dialog. */
export function FoodAlerts() {
  const titleId = useId()
  const { data, isLoading, isError, refetch, isFetching } = useFoodAlerts()
  const { alerts, unavailable, stale } = foodAlertView(data, isError, useNow())
  return (
    <section id="food-alerts" tabIndex={-1} className="food-alerts" aria-labelledby={titleId}>
      <h3 id={titleId} className="sr-only">
        Food alerts
      </h3>
      <header className="food-alerts__intro">
        <div className="food-alerts__source">
          <span className="food-alerts__source-icon">
            <Icon icon={ShieldAlert} />
          </span>
          <div>
            <p>Food Standards Agency</p>
            <span>Official UK food safety notices</span>
          </div>
        </div>
        <a href={allAlerts} target="_blank" rel="noopener noreferrer">
          View all alerts <Icon icon={ArrowUpRight} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </header>
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
            <Accordion
              itemClassName="food-alert-item"
              summaryClassName="food-alerts__notice"
              items={alerts.map((alert) => ({
                id: alert.id,
                title: <FoodAlertSummary alert={alert} />,
                content: <FoodAlertItem alert={alert} />,
              }))}
            />
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
    </section>
  )
}
