import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { FoodAlert } from '../../../features/food-alerts/types'
import { foodAlertLabels } from '../../../features/food-alerts/food-alert-view'
import { Icon } from '../../ui/Icon'
import './FoodAlertItem.css'

export function FoodAlertItem({ alert }: { alert: FoodAlert }) {
  const details = alert.details
  return (
    <details className="food-alert-item">
      <summary className="food-alerts__notice">
        <span className="food-alerts__meta">
          <span className="food-alerts__kind">{foodAlertLabels[alert.kind]}</span>
          <time dateTime={alert.publishedAt}>
            {format(parseISO(alert.publishedAt), 'd MMM yyyy')}
          </time>
        </span>
        <span className="food-alerts__headline">{alert.title}</span>
        <Icon icon={ChevronDown} />
        <span className="sr-only"> — expand for affected products, the risk and what to do</span>
      </summary>
      <div className="food-alert-item__body">
        <section aria-label="Affected products" className="food-alert-item__products">
          <h3>Affected products</h3>
          {details?.products.length ? (
            <ul>
              {details.products.map((product, index) => (
                <li key={index}>
                  <h4>{product.name}</h4>
                  <dl>
                    {product.packSize && (
                      <>
                        <dt>Pack size</dt>
                        <dd>{product.packSize}</dd>
                      </>
                    )}
                    {product.productCode && (
                      <>
                        <dt>Product code</dt>
                        <dd>{product.productCode}</dd>
                      </>
                    )}
                  </dl>
                  {product.batches.map((batch, batchIndex) => (
                    <dl key={batchIndex} className="food-alert-item__batch">
                      {batch.batchCode && (
                        <>
                          <dt>Batch code</dt>
                          <dd>{batch.batchCode}</dd>
                        </>
                      )}
                      {batch.bestBefore && (
                        <>
                          <dt>Best before</dt>
                          <dd>{batch.bestBefore}</dd>
                        </>
                      )}
                      {batch.useBy && (
                        <>
                          <dt>Use by</dt>
                          <dd>{batch.useBy}</dd>
                        </>
                      )}
                    </dl>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p>Product details were not supplied in this feed. Check the official FSA notice.</p>
          )}
        </section>
        <div className="food-alert-item__advice">
          <section aria-label="The risk">
            <h3>The risk</h3>
            {details?.riskStatements.length ? (
              details.riskStatements.map((risk, index) => <p key={index}>{risk}</p>)
            ) : (
              <p>Risk details were not supplied in this feed. Check the official FSA notice.</p>
            )}
          </section>
          <section aria-label="What to do">
            <h3>What to do</h3>
            <p>
              {details?.consumerAdvice ||
                'Consumer advice was not supplied in this feed. Check the official FSA notice.'}
            </p>
          </section>
          <a
            className="food-alert-item__official"
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the official FSA notice <Icon icon={ArrowUpRight} />
            <span className="sr-only"> for {alert.title} (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </details>
  )
}
