import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { useWhereItems } from '../../features/where-is-it/useWhereItems'
import { wherePhoto, type WhereItem, type WhereWrite } from '../../features/where-is-it/types'
import { Modal } from '../ui/Modal'
import { FriendlyTime } from '../ui/FriendlyTime'

const fields = (item?: WhereItem) => ({
  title: item?.title ?? '',
  location: item?.location ?? '',
  note: item?.note ?? '',
  removePhoto: false,
})
export function WhereItemForm({
  widgetId,
  item,
  locations,
  onClose,
}: {
  widgetId: string
  item?: WhereItem
  locations: string[]
  onClose: () => void
}) {
  const api = useWhereItems()
  const [original, setOriginal] = useState(item)
  const [baseline, setBaseline] = useState(() => fields(item))
  const [draft, setDraft] = useState(baseline)
  const [photo, setPhoto] = useState<File>()
  const [preview, setPreview] = useState('')
  const [validation, setValidation] = useState<Record<string, string>>({})
  const [uncertain, setUncertain] = useState(false)
  const [saving, setSaving] = useState(false)
  const attempt = useRef<{ signature: string; write: WhereWrite } | null>(null)
  const guard = useDraftGuard(
    JSON.stringify(draft) !== JSON.stringify(baseline) || !!photo || uncertain,
    api.pending,
  )
  const id = useId()
  const latest = original ? api.items.find((entry) => entry.id === original.id) : undefined
  const stale = !!original && api.known && (!latest || latest.version !== original.version)
  useEffect(() => {
    if (!photo) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])
  useEffect(() => {
    api.clearError()
  }, []) // A newly opened draft starts with fresh feedback.
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving || api.pending || api.offline || (stale && !uncertain)) return
    const invalid: Record<string, string> = {}
    if (!draft.title.trim()) invalid.title = 'Enter an item name.'
    if (!draft.location.trim()) invalid.location = 'Enter where the item is kept.'
    if (Object.keys(invalid).length) {
      setValidation(invalid)
      document.getElementById(id + '-' + Object.keys(invalid)[0])?.focus()
      return
    }
    const signature = JSON.stringify(draft)
    if (
      !attempt.current ||
      (!uncertain &&
        (attempt.current.signature !== signature || attempt.current.write.photo !== photo))
    ) {
      attempt.current = {
        signature,
        write: {
          action: original ? 'edit' : 'add',
          photo,
          body: {
            ...draft,
            widgetId,
            ...(original ? { id: original.id, version: original.version } : {}),
            requestKey: crypto.randomUUID(),
          },
        },
      }
    }
    setSaving(true)
    if (await api.save(attempt.current.write)) guard.complete(onClose)
    else {
      setSaving(false)
      // Resolve the identical request before permitting a changed intent after a lost response.
      const status = api.lastFailure()?.status
      setUncertain(status === 0 || (status !== undefined && status >= 500))
    }
  }
  function loadLatest() {
    if (!latest) return
    setOriginal(latest)
    const next = fields(latest)
    setBaseline(next)
    setDraft(next)
    setPhoto(undefined)
    setUncertain(false)
    attempt.current = null
    api.clearError()
  }
  return (
    <Modal
      title={original ? 'Edit item' : 'Add item'}
      scrollable
      busy={api.pending}
      onClose={() => guard.close(onClose)}
      className="where-dialog"
    >
      <p className="note">Just the name and where it belongs are required.</p>
      {stale && !saving && !uncertain && (
        <div role="alert" className="where-conflict">
          <p>This item changed or was removed. Your draft is kept.</p>
          {latest && (
            <>
              <p>
                Latest: <strong>{latest.title}</strong> · {latest.location}
              </p>
              <p className="where-note">{latest.note}</p>
              <button type="button" className="secondary" onClick={loadLatest}>
                Discard draft and load latest
              </button>
            </>
          )}
        </div>
      )}
      {api.error && (
        <p role="alert" className="error">
          {api.error}
        </p>
      )}
      {uncertain && (
        <p role="status" className="note">
          Your draft is kept. Retry this save to check its result before making further changes.
        </p>
      )}
      <form onSubmit={submit} noValidate className="where-form" aria-busy={api.pending}>
        <fieldset disabled={api.pending || uncertain}>
          <label htmlFor={id + '-title'}>
            Item name <span className="note">(required)</span>
          </label>
          <input
            id={id + '-title'}
            value={draft.title}
            maxLength={100}
            required
            autoComplete="off"
            aria-invalid={!!validation.title}
            aria-describedby={validation.title ? id + '-title-error' : undefined}
            onChange={(e) => {
              setDraft({ ...draft, title: e.target.value })
              setValidation({})
            }}
          />
          {validation.title && (
            <span id={id + '-title-error'} className="error">
              {validation.title}
            </span>
          )}
          <label htmlFor={id + '-location'}>
            Location <span className="note">(required)</span>
          </label>
          <input
            id={id + '-location'}
            value={draft.location}
            maxLength={160}
            required
            list={id + '-locations'}
            autoComplete="off"
            placeholder="e.g. Hall cupboard · top shelf"
            aria-invalid={!!validation.location}
            aria-describedby={validation.location ? id + '-location-error' : undefined}
            onChange={(e) => {
              setDraft({ ...draft, location: e.target.value })
              setValidation({})
            }}
          />
          {validation.location && (
            <span id={id + '-location-error'} className="error">
              {validation.location}
            </span>
          )}
          <datalist id={id + '-locations'}>
            {locations.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
          <label htmlFor={id + '-note'}>
            Note <span className="note">(optional)</span>
          </label>
          <textarea
            id={id + '-note'}
            rows={3}
            value={draft.note}
            maxLength={1000}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
          <label htmlFor={id + '-photo'}>
            Photo <span className="note">(optional)</span>
          </label>
          <input
            id={id + '-photo'}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={id + '-photo-help'}
            onChange={(e) => {
              setPhoto(e.target.files?.[0])
              setDraft({ ...draft, removePhoto: false })
            }}
          />
          <p id={id + '-photo-help'} className="note">
            JPG, PNG or WebP · up to 10 MB, 24 megapixels and 8192 pixels per side.
          </p>
          {(preview || (original?.photoKey && !draft.removePhoto)) && (
            <img
              className="where-photo"
              src={preview || wherePhoto(original!)}
              alt="Item photo preview"
              width={640}
              height={400}
            />
          )}
          {(photo || original?.photoKey) && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setPhoto(undefined)
                setDraft({ ...draft, removePhoto: true })
                const input = document.getElementById(id + '-photo') as HTMLInputElement
                input.value = ''
              }}
            >
              Remove photo
            </button>
          )}
        </fieldset>
        {original && (
          <p className="note">
            Updated <FriendlyTime value={original.updatedAt} />
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={api.pending || api.offline || (stale && !uncertain)}>
            {api.pending ? 'Saving…' : uncertain ? 'Retry this save' : 'Save item'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={api.pending}
            onClick={() => guard.close(onClose)}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
