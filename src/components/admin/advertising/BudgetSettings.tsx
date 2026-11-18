import type { AdvertConfig } from '../../../features/advertising/types'
import { NumberField, TextField, type EditAdvert } from './Fields'
export function BudgetSettings({ draft, edit }: { draft: AdvertConfig; edit: EditAdvert }) {
  return (
    <details>
      <summary>Budgets, usage caps and price estimates</summary>
      <fieldset>
        <legend>Service limits and estimates · UTC day and calendar month</legend>
        <p className="note">
          Zero blocks calls. Amounts are US dollars. The service reserves a conservative input
          ceiling and capped text output before text generation/review. Image calls use the separate
          estimated reservation with no output token ceiling. Unknown outcomes keep that
          reservation. These service limits are separate from provider billing controls.
        </p>
        <div className="advert-settings__grid">
          {(['dailyMicros', 'monthlyMicros'] as const).map((key) => (
            <NumberField
              key={key}
              label={key === 'dailyMicros' ? 'Daily budget, USD' : 'Monthly budget, USD'}
              value={draft.budget[key] / 1000000}
              max={100}
              step={0.000001}
              onChange={(v) =>
                edit((d) => {
                  d.budget[key] = Math.round(v * 1000000)
                })
              }
            />
          ))}
          {(
            [
              'dailyCalls',
              'monthlyCalls',
              'dailyTokens',
              'monthlyTokens',
              'dailyImages',
              'monthlyImages',
            ] as const
          ).map((key) => (
            <NumberField
              key={key}
              label={key.replace(/([A-Z])/g, ' $1')}
              value={draft.budget[key]}
              onChange={(v) =>
                edit((d) => {
                  d.budget[key] = v
                })
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Standard short-context price estimates · USD per million tokens</legend>
        <div className="advert-settings__grid">
          <TextField
            label="Prices checked on (UTC date)"
            type="date"
            value={draft.prices.checkedAt}
            onChange={(v) =>
              edit((d) => {
                d.prices.checkedAt = v
              })
            }
          />
          <NumberField
            label="Recheck prices after days"
            value={draft.prices.validDays}
            min={1}
            max={30}
            onChange={(v) =>
              edit((d) => {
                d.prices.validDays = v
              })
            }
          />
          {Object.entries(draft.prices.models).flatMap(([model, price]) =>
            (['input', 'output'] as const).map((key) => (
              <NumberField
                key={model + key}
                label={model + ' ' + key + ', USD / 1M'}
                value={price[key] / 1000000}
                min={0.000001}
                max={500}
                step={0.000001}
                onChange={(v) =>
                  edit((d) => {
                    d.prices.models[model][key] = Math.round(v * 1000000)
                  })
                }
              />
            )),
          )}
        </div>
        <p className="note">
          Initial rates checked 17 November 2026 against OpenAI Standard pricing. Estimates exclude
          tools and other unimplemented billing options. Stale or future-dated pricing blocks
          preparation.{' '}
          <a
            href="https://developers.openai.com/api/docs/pricing"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check current OpenAI prices
          </a>
          .
        </p>
      </fieldset>
    </details>
  )
}
