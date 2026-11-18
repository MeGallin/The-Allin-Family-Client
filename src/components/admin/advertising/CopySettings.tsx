import type { AdvertConfig, AdvertFormat } from '../../../features/advertising/types'
import { LinesField, NumberField, SwitchField, TextField, type EditAdvert } from './Fields'
export function CopySettings({ draft, edit }: { draft: AdvertConfig; edit: EditAdvert }) {
  return (
    <details open>
      <summary>Service, branding and formats</summary>
      <fieldset>
        <legend>Service controls</legend>
        <SwitchField
          label="Enable advertising"
          checked={draft.enabled}
          onChange={(v) =>
            edit((d) => {
              d.enabled = v
            })
          }
        />
        <SwitchField
          label="Pause preparation and publication"
          checked={draft.paused}
          onChange={(v) =>
            edit((d) => {
              d.paused = v
            })
          }
        />
        <SwitchField
          label="Require manual approval for each candidate"
          checked={draft.manualApproval}
          onChange={(v) =>
            edit((d) => {
              d.manualApproval = v
            })
          }
        />
        <p className="note">
          Manual approval is recommended for initial samples. Turn it off to publish complete
          adverts automatically on the configured schedule. Disabled advertising serves nothing and
          makes no provider calls.
        </p>
      </fieldset>
      <fieldset>
        <legend>Approved copy</legend>
        <div className="advert-settings__grid">
          <TextField
            label="Brand name"
            value={draft.brand.name}
            maxLength={80}
            onChange={(v) =>
              edit((d) => {
                d.brand.name = v
              })
            }
          />
          <TextField
            label="Tone"
            value={draft.brand.tone}
            maxLength={160}
            onChange={(v) =>
              edit((d) => {
                d.brand.tone = v
              })
            }
          />
          <LinesField
            label="Copy exclusions"
            value={draft.brand.exclusions}
            onChange={(v) =>
              edit((d) => {
                d.brand.exclusions = v
              })
            }
          />
        </div>
        <p className="note">
          The model writes fresh headlines, messages and hypothetical scenarios grounded in these
          approved facts. Structural checks constrain copy, references and numbers; they cannot
          prove semantic accuracy. Keep manual approval on for early samples. Optional model review
          adds a check, not a guarantee. Turning manual approval off permits validated candidates to
          publish automatically.
        </p>
      </fieldset>
      <fieldset>
        <legend>Allowed formats</legend>
        <div className="advert-settings__grid">
          {(['headline', 'checklist', 'process', 'comparison'] as AdvertFormat[]).map((format) => (
            <SwitchField
              key={format}
              label={format === 'comparison' ? 'Illustrative comparison' : format}
              checked={draft.formats.includes(format)}
              onChange={(v) =>
                edit((d) => {
                  d.formats = v ? [...d.formats, format] : d.formats.filter((f) => f !== format)
                })
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Copy limits</legend>
        <div className="advert-settings__grid">
          {(['headline', 'message', 'item', 'maxItems'] as const).map((key) => (
            <NumberField
              key={key}
              label={key === 'maxItems' ? 'Maximum items (2–4)' : 'Maximum ' + key + ' characters'}
              value={draft.limits[key]}
              min={key === 'maxItems' ? 2 : key === 'headline' ? 20 : 40}
              max={key === 'maxItems' ? 4 : key === 'headline' ? 100 : key === 'item' ? 240 : 400}
              onChange={(v) =>
                edit((d) => {
                  d.limits[key] = v
                })
              }
            />
          ))}
        </div>
      </fieldset>
    </details>
  )
}
