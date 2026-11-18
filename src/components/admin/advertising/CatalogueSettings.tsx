import type { AdvertConfig } from '../../../features/advertising/types'
import { LinesField, NumberField, SwitchField, TextField, type EditAdvert } from './Fields'
export function CatalogueSettings({ draft, edit }: { draft: AdvertConfig; edit: EditAdvert }) {
  return (
    <details>
      <summary>Approved feature facts and destinations</summary>
      <p className="note">
        Only public feature metadata is sent to the model. Approve accurate facts here; never enter
        family records. Feature IDs, titles and CTA destinations are fixed in code. Countdown,
        Adventure, Recommendations, Walking and Quiz are proposed and excluded.
      </p>
      {draft.features.map((feature, index) => (
        <details key={feature.id}>
          <summary>
            {feature.title}
            {feature.enabled ? '' : ' · excluded'}
          </summary>
          <fieldset>
            <legend>
              {feature.title} · CTA {feature.ctaId}
            </legend>
            <div className="advert-settings__grid">
              <SwitchField
                label={'Allow ' + feature.title}
                checked={feature.enabled}
                onChange={(v) =>
                  edit((d) => {
                    d.features[index].enabled = v
                  })
                }
              />
              <NumberField
                label={feature.title + ' selection weight'}
                value={feature.weight}
                min={1}
                max={100}
                onChange={(v) =>
                  edit((d) => {
                    d.features[index].weight = v
                  })
                }
              />
              <TextField
                label={feature.title + ' expiry (UTC, optional)'}
                value={feature.expiresAt ?? ''}
                required={false}
                maxLength={20}
                onChange={(v) =>
                  edit((d) => {
                    d.features[index].expiresAt = v || null
                  })
                }
              />
            </div>
            <p className="note">
              Expiry format: YYYY-MM-DDTHH:mm:ssZ. Changing approved facts, availability or expiry
              invalidates matching published copy when applied.
            </p>
            {feature.facts.map((fact, factIndex) => (
              <label key={fact.id}>
                {feature.title + ' approved ' + fact.id}
                <textarea
                  rows={2}
                  value={fact.text}
                  maxLength={Math.min(draft.limits.item, draft.limits.message)}
                  required
                  onChange={(e) =>
                    edit((d) => {
                      d.features[index].facts[factIndex].text = e.target.value
                    })
                  }
                />
              </label>
            ))}
            <div className="actions">
              <button
                type="button"
                className="secondary"
                disabled={feature.facts.length >= 8}
                onClick={() =>
                  edit((d) => {
                    const used = new Set(d.features[index].facts.map((f) => f.id))
                    const id = Array.from({ length: 8 }, (_, i) => 'fact-' + (i + 1)).find(
                      (value) => !used.has(value),
                    )!
                    d.features[index].facts.push({ id, text: '' })
                  })
                }
              >
                Add approved fact for {feature.title}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={feature.facts.length <= 2}
                onClick={() =>
                  edit((d) => {
                    d.features[index].facts.pop()
                  })
                }
              >
                Remove last fact for {feature.title}
              </button>
            </div>
            <LinesField
              label={feature.title + ' copy exclusions'}
              value={feature.exclusions}
              onChange={(v) =>
                edit((d) => {
                  d.features[index].exclusions = v
                })
              }
            />
          </fieldset>
        </details>
      ))}
    </details>
  )
}
