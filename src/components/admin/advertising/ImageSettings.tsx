import type { AdvertConfig } from '../../../features/advertising/types'
import { NumberField, SwitchField, TextField, type EditAdvert } from './Fields'
export function ImageSettings({ draft, edit }: { draft: AdvertConfig; edit: EditAdvert }) {
  return (
    <details>
      <summary>Dynamic campaign artwork</summary>
      <fieldset>
        <legend>Generated images</legend>
        <SwitchField
          label="Generate artwork for new adverts"
          checked={draft.image.enabled}
          onChange={(v) =>
            edit((d) => {
              d.image.enabled = v
            })
          }
        />
        <p className="note">
          Artwork is generated for each campaign from approved feature facts. Existing adverts keep
          their own artwork. Image planning complexity is independent of output quality.
        </p>
        <fieldset>
          <legend>Allowed campaign compositions</legend>
          {(['poster', 'split', 'image-led'] as const).map((layout) => (
            <SwitchField
              key={layout}
              label={
                layout === 'poster'
                  ? 'Poster · bold type above the hero'
                  : layout === 'split'
                    ? 'Split · type left, image right'
                    : 'Image-led · protected type on artwork'
              }
              checked={draft.image.layouts.includes(layout)}
              onChange={(checked) =>
                edit((d) => {
                  d.image.layouts = checked
                    ? [...d.image.layouts, layout]
                    : d.image.layouts.filter((value) => value !== layout)
                })
              }
            />
          ))}
          <p className="note">
            Keep at least one composition selected. Enabled layouts rotate across successive
            campaigns. The model creates a visual concept for the next layout; artwork follows its
            protected type zones.
          </p>
        </fieldset>
        <div className="advert-settings__grid">
          <NumberField
            label="Maximum headline words"
            value={draft.image.maxHeadlineWords}
            min={2}
            max={8}
            onChange={(v) =>
              edit((d) => {
                d.image.maxHeadlineWords = v
              })
            }
          />
          <label>
            Image model
            <select
              value={draft.image.model}
              onChange={(e) =>
                edit((d) => {
                  d.image.model = e.target.value as AdvertConfig['image']['model']
                })
              }
            >
              <option>gpt-image-2.6-flare</option>
              <option>gpt-image-2.6-sunburst</option>
            </select>
          </label>
          {(['quality', 'complexity'] as const).map((key) => (
            <label key={key}>
              {key === 'quality' ? 'Image quality' : 'Visual planning complexity'}
              <select
                value={draft.image[key]}
                onChange={(e) =>
                  edit((d) => {
                    d.image[key] = e.target.value as AdvertConfig['image'][typeof key]
                  })
                }
              >
                <option>low</option>
                <option>medium</option>
                <option>high</option>
              </select>
            </label>
          ))}
          <label>
            Image size
            <select
              value={draft.image.size}
              onChange={(e) =>
                edit((d) => {
                  d.image.size = e.target.value as AdvertConfig['image']['size']
                })
              }
            >
              <option value="1024x1024">Square · 1024 × 1024</option>
              <option value="1536x1024">Landscape · 1536 × 1024</option>
            </select>
          </label>
          <NumberField
            label="Image timeout, seconds"
            value={draft.image.timeoutSeconds}
            min={15}
            max={120}
            onChange={(v) =>
              edit((d) => {
                d.image.timeoutSeconds = v
              })
            }
          />
          <NumberField
            label="Maximum visual brief characters"
            value={draft.image.maxPromptCharacters}
            min={200}
            max={2000}
            onChange={(v) =>
              edit((d) => {
                d.image.maxPromptCharacters = v
              })
            }
          />
          <NumberField
            label="Estimated reservation per image, USD"
            value={draft.image.reservationMicros / 1000000}
            min={0.1}
            max={10}
            step={0.01}
            onChange={(v) =>
              edit((d) => {
                d.image.reservationMicros = Math.round(v * 1000000)
              })
            }
          />
          <TextField
            label="Campaign artwork style"
            value={draft.image.promptStyle}
            maxLength={800}
            onChange={(v) =>
              edit((d) => {
                d.image.promptStyle = v
              })
            }
          />
        </div>
        <p className="note">
          The Images API has no output token ceiling. This reservation is a conservative cost
          estimate, not a guaranteed invoice cap. Unknown outcomes retain the reservation and pause
          generation. Set daily and monthly image counts as well as call and currency limits.
          Standard estimates: USD5 text input, USD8 image input and USD30 image output per million
          tokens.
        </p>
      </fieldset>
    </details>
  )
}
