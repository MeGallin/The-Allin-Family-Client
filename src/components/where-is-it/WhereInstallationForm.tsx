import { useRef, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppStore } from '../../app/store-hooks'
import { useWidgets } from '../../features/widgets/useWidgets'
import { executeWidgetWrite } from '../../features/widgets/widgets-actions'
import { widgetsApi } from '../../services/widgets-query'
import { shoppingError } from '../../services/shopping-query'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import type { FamilyWidget } from '../../features/widgets/types'
import { Modal } from '../ui/Modal'
import './WhereIsItWorkspace.css'

export default function WhereInstallationForm({
  widget,
  onClose,
  onSaved,
}: {
  widget?: FamilyWidget
  onClose: () => void
  onSaved: () => void
}) {
  const api = useWidgets()
  const dispatch = useAppDispatch(),
    store = useAppStore()
  const [original, setOriginal] = useState(widget)
  const [baseline, setBaseline] = useState({
    title: widget?.title ?? 'Where Is It?',
    visibility: widget?.visibility ?? 'family',
  })
  const [draft, setDraft] = useState(baseline)
  const [uncertain, setUncertain] = useState(false)
  const [saving, setSaving] = useState(false)
  const key = useRef(crypto.randomUUID())
  const guard = useDraftGuard(
    JSON.stringify(draft) !== JSON.stringify(baseline) || uncertain,
    api.pending,
  )
  const latest = original ? api.widgets.find((entry) => entry.id === original.id) : undefined
  const stale = !!original && (!latest || latest.version !== original.version)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving || api.pending || api.offline || (stale && !uncertain)) return
    setSaving(true)
    const saved = await dispatch(
      executeWidgetWrite({
        action: original ? 'edit' : 'add',
        body: {
          ...draft,
          kind: 'where-is-it',
          ...(original ? { id: original.id, version: original.version } : {}),
          requestKey: key.current,
        },
      }),
    )
    if (saved) guard.complete(onSaved)
    else {
      setSaving(false)
      const status = shoppingError(
        widgetsApi.endpoints.changeWidget.select('widget-write')(store.getState()).error,
      )?.status
      setUncertain(status === 0 || (status !== undefined && status >= 500))
    }
  }
  return (
    <Modal
      title={original ? 'Collection settings' : 'Install Where Is It?'}
      busy={api.pending}
      onClose={() => guard.close(onClose)}
      scrollable
    >
      <p className="note">
        Family is recommended for household belongings. Personal collections and photos are only
        visible to you.
      </p>
      {api.error && (
        <p role="alert" className="error">
          {api.error}
        </p>
      )}
      {uncertain && (
        <p role="status" className="note">
          This may have saved. Retry the same request to confirm before changing the form.
        </p>
      )}
      {stale && !saving && !uncertain && (
        <div role="alert">
          <p>This installation changed. Your draft is kept.</p>
          {latest && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setOriginal(latest)
                const next = { title: latest.title, visibility: latest.visibility }
                setDraft(next)
                setBaseline(next)
                key.current = crypto.randomUUID()
                api.clearError()
              }}
            >
              Discard draft and load latest
            </button>
          )}
        </div>
      )}
      <form onSubmit={submit} className="where-form">
        <fieldset disabled={api.pending || uncertain}>
          <label>
            Collection name
            <input
              value={draft.title}
              maxLength={120}
              required
              onChange={(e) => {
                setDraft({ ...draft, title: e.target.value })
                key.current = crypto.randomUUID()
              }}
            />
          </label>
          <label>
            Visibility
            <select
              value={draft.visibility}
              onChange={(e) => {
                setDraft({ ...draft, visibility: e.target.value as 'family' | 'private' })
                key.current = crypto.randomUUID()
              }}
            >
              <option value="family">Family · recommended</option>
              <option value="private">Personal · only you</option>
            </select>
          </label>
          {original && (
            <p className="note">
              Changing to Family shares this collection’s existing items and photos with everyone.
            </p>
          )}
        </fieldset>
        <div className="actions">
          <button type="submit" disabled={api.pending || api.offline || (stale && !uncertain)}>
            {api.pending
              ? 'Saving…'
              : uncertain
                ? 'Retry this save'
                : original
                  ? 'Save settings'
                  : 'Install collection'}
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
