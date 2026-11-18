import type { AdvertAdmin, AdvertConfig } from '../../../features/advertising/types'
import { NumberField, SwitchField, type EditAdvert } from './Fields'
export function ModelSettings({
  draft,
  edit,
  models,
}: {
  draft: AdvertConfig
  edit: EditAdvert
  models: AdvertAdmin['models']
}) {
  return (
    <details>
      <summary>OpenAI models and call limits</summary>
      <p className="note">
        OpenAI is the implemented provider. Keys stay in environment settings. Luna and Sol have
        passed small local inference tests; the other allowed models have documented capabilities.
        No tools, browsing or family records enter a prompt.
      </p>
      {(['generation', 'review'] as const).map((kind) => (
        <fieldset key={kind}>
          <legend>{kind === 'generation' ? 'Generation' : 'Optional model review'}</legend>
          {kind === 'review' && (
            <SwitchField
              label="Review every generated candidate with a second model"
              checked={draft.review.enabled}
              onChange={(v) =>
                edit((d) => {
                  d.review.enabled = v
                })
              }
            />
          )}
          <div className="advert-settings__grid">
            <label>
              {kind} model
              <select
                value={draft[kind].model}
                onChange={(e) =>
                  edit((d) => {
                    d[kind].model = e.target.value
                    if (!models[e.target.value].efforts.includes(d[kind].effort))
                      d[kind].effort = 'low'
                  })
                }
              >
                {Object.keys(models).map((model) => (
                  <option key={model}>{model}</option>
                ))}
              </select>
            </label>
            <label>
              {kind} reasoning
              <select
                value={draft[kind].effort}
                onChange={(e) =>
                  edit((d) => {
                    d[kind].effort = e.target.value
                  })
                }
              >
                {models[draft[kind].model].efforts.map((effort) => (
                  <option key={effort}>{effort}</option>
                ))}
              </select>
            </label>
            <NumberField
              label={kind + ' maximum output tokens'}
              value={draft[kind].maxOutputTokens}
              min={128}
              max={kind === 'review' ? 1024 : 2048}
              onChange={(v) =>
                edit((d) => {
                  d[kind].maxOutputTokens = v
                })
              }
            />
          </div>
        </fieldset>
      ))}
      <fieldset>
        <legend>Bounded execution</legend>
        <div className="advert-settings__grid">
          <NumberField
            label="Timeout per provider call, seconds"
            value={draft.generation.timeoutSeconds}
            min={5}
            max={45}
            onChange={(v) =>
              edit((d) => {
                d.generation.timeoutSeconds = v
              })
            }
          />
          <NumberField
            label="Retries after a known rejected attempt"
            value={draft.generation.retries}
            max={2}
            onChange={(v) =>
              edit((d) => {
                d.generation.retries = v
              })
            }
          />
          <NumberField
            label="Retry backoff, seconds"
            value={draft.generation.backoffSeconds}
            min={5}
            max={3600}
            onChange={(v) =>
              edit((d) => {
                d.generation.backoffSeconds = v
              })
            }
          />
        </div>
        <p className="note">
          Retries run on later ticks, each with a new budget reservation. Ambiguous outcomes retain
          their reserved cost and pause for an administrator to inspect; they are never retried
          immediately.
        </p>
      </fieldset>
    </details>
  )
}
