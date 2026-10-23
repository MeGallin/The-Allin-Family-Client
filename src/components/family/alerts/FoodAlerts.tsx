import { ShieldAlert } from 'lucide-react'
import { useId } from 'react'
import { useFoodAlerts } from '../../../features/food-alerts/useFoodAlerts'
import { useNow } from '../../../hooks/useNow'
import { foodAlertView } from '../../../features/food-alerts/food-alert-view'
import { FoodAlertItem, FoodAlertSummary } from './FoodAlertItem'
import { Accordion } from '../../ui/Accordion'
import { AlertSource } from '../../ui/AlertBriefing'
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
      <AlertSource
        provider="Food Standards Agency"
        description="Official UK food safety notices"
        icon={ShieldAlert}
        href={allAlerts}
        linkLabel="View all alerts"
      />
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
              itemClassName="food-alert-item alert-briefing__item"
              summaryClassName="food-alerts__notice alert-briefing__summary"
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
