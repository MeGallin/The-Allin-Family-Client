import { useId, useRef, useState, type FormEvent } from 'react'
import type {
  HouseholdJob,
  JobDraft,
  JobScope,
  JobWrite,
} from '../../features/household-jobs/types'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { Modal } from '../ui/Modal'
export function JobComposer({
  job,
  scope,
  members,
  busy,
  error,
  latest,
  onSave,
  onClose,
}: {
  job?: HouseholdJob
  scope: JobScope
  members: { id: number; name: string }[]
  busy: boolean
  error: string
  latest?: HouseholdJob
  onSave: (w: JobWrite) => Promise<boolean>
  onClose: () => void
}) {
  const baseline: JobDraft = {
    scope: job?.scope ?? scope,
    title: job?.title ?? '',
    note: job?.note ?? '',
    area: job?.area ?? '',
    targetDate: job?.targetDate ?? null,
    repeat: job?.repeat ?? 'none',
    assigneeId: job?.assigneeId ?? null,
  }
  const [draft, setDraft] = useState(baseline)
  const guard = useDraftGuard(JSON.stringify(draft) !== JSON.stringify(baseline), busy)
  const id = useId()
  const attempt = useRef<{ signature: string; key: string } | null>(null)
  const stale = !!job && (!latest || latest.version !== job.version)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy || stale) return
    const body = { ...draft, ...(job ? { id: job.id, version: job.version } : {}) }
    const signature = JSON.stringify(body)
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() }
    if (
      await onSave({
        action: job ? 'edit' : 'add',
        body: { ...body, requestKey: attempt.current.key },
      })
    )
      guard.complete(onClose)
  }
  return (
    <Modal
      title={job ? 'Edit job' : 'Add a job'}
      onClose={() => guard.close(onClose)}
      busy={busy}
      scrollable
    >
      <p className="note">
        {scope === 'mine'
          ? 'Only you can see this job and its history.'
          : 'Family members can see this job. The creator or an administrator manages its details and assignment.'}
      </p>
      {stale && (
        <p role="alert" className="error">
          This job changed. Your draft is kept. Close this form and reopen the latest job before
          saving.
        </p>
      )}
      <form onSubmit={submit}>
        <label htmlFor={id + 'title'}>Job title</label>
        <input
          disabled={busy}
          id={id + 'title'}
          required
          maxLength={120}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <label htmlFor={id + 'note'}>Note (optional)</label>
        <textarea
          disabled={busy}
          id={id + 'note'}
          maxLength={2000}
          value={draft.note}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        />
        <label htmlFor={id + 'area'}>Room or area (optional)</label>
        <input
          disabled={busy}
          id={id + 'area'}
          maxLength={80}
          value={draft.area}
          onChange={(e) => setDraft({ ...draft, area: e.target.value })}
        />
        <label htmlFor={id + 'day'}>Target day (optional)</label>
        <input
          disabled={busy}
          id={id + 'day'}
          type="date"
          min="1000-01-01"
          max="9998-12-31"
          value={draft.targetDate ?? ''}
          onInput={(e) => {
            // Native date fills can emit input without React detecting a change.
            const targetDate = e.currentTarget.value || null
            setDraft((current) => ({ ...current, targetDate }))
          }}
          onChange={(e) => setDraft({ ...draft, targetDate: e.target.value || null })}
        />
        <p className="note">A planning guide, never a deadline. Leave empty for a flexible job.</p>
        <label htmlFor={id + 'repeat'}>Repeat</label>
        <select
          disabled={busy}
          id={id + 'repeat'}
          value={draft.repeat}
          onChange={(e) => setDraft({ ...draft, repeat: e.target.value as JobDraft['repeat'] })}
        >
          <option value="none">Does not repeat</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <p className="note">
          Completing a repeat keeps its history and advances its target day. Flexible repeats stay
          flexible.
        </p>
        {scope === 'family' && (
          <>
            <label htmlFor={id + 'person'}>Assign to</label>
            <select
              disabled={busy}
              id={id + 'person'}
              value={draft.assigneeId ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, assigneeId: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Anyone can claim</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="actions">
          <button disabled={busy || stale || !draft.title.trim()}>
            {busy ? 'Saving…' : 'Save job'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => guard.close(onClose)}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
