import { useId, useRef, useState, type FormEvent } from 'react'
import { usePersonalNotes } from '../../features/notes/usePersonalNotes'
import type { NoteDraft, PersonalNote } from '../../features/notes/types'
import { dateInputValue } from '../../lib/dates'
import { Modal } from '../ui/Modal'
import './NoteComposer.css'
export default function NoteComposer({
  note,
  onClose,
}: {
  note?: PersonalNote
  onClose: () => void
}) {
  const { add, edit, pending, error, clearError } = usePersonalNotes()
  const [original] = useState(note)
  const [draft, setDraft] = useState<NoteDraft>({
    title: note?.title ?? '',
    header: note?.header ?? '',
    body: note?.body ?? '',
    footer: note?.footer ?? '',
    noteDate: note?.noteDate ?? dateInputValue(new Date()),
  })
  const addition = useRef<{ signature: string; key: string } | null>(null)
  const failureNotice = useRef<HTMLParagraphElement>(null)
  const [validation, setValidation] = useState('')
  const stale = !!original && original.version !== note?.version
  const problem =
    validation ||
    (stale
      ? 'This note changed in another window. Your draft is still here. Close and reopen the latest note before saving.'
      : error)
  const id = useId()
  function update(field: keyof NoteDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setValidation('')
    const body = {
      ...draft,
      title: draft.title.trim(),
      header: draft.header.trim(),
      body: draft.body.trim(),
      footer: draft.footer.trim(),
    }
    if (!body.title || !body.body || !body.noteDate) {
      setValidation('Add a title, note date and body before saving.')
      requestAnimationFrame(() => failureNotice.current?.focus())
      return
    }
    const signature = JSON.stringify(body)
    if (!addition.current || addition.current.signature !== signature)
      addition.current = { signature, key: crypto.randomUUID() }
    if (original ? await edit(original, body) : await add(body, addition.current.key)) onClose()
    else requestAnimationFrame(() => failureNotice.current?.focus())
  }
  return (
    <Modal
      title={original ? 'Edit your note' : 'New personal note'}
      onClose={onClose}
      busy={pending}
    >
      <p className="note">Only you can view and change this note.</p>
      <form className="note-composer" onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending}>
          <label htmlFor={id + '-title'}>Title</label>
          <input
            id={id + '-title'}
            required
            maxLength={120}
            value={draft.title}
            onChange={(e) => update('title', e.target.value)}
            autoComplete="off"
          />
          <label htmlFor={id + '-date'}>Note date</label>
          <input
            id={id + '-date'}
            type="date"
            required
            min="1000-01-01"
            max="9999-12-31"
            value={draft.noteDate}
            onChange={(e) => update('noteDate', e.target.value)}
            onInput={(e) => update('noteDate', e.currentTarget.value)}
            aria-describedby={id + '-date-help'}
          />
          <p className="note" id={id + '-date-help'}>
            The date this note relates to. Creation and edit times are recorded separately.
          </p>
          <label htmlFor={id + '-header'}>
            Header <span className="field-optional">(optional)</span>
          </label>
          <textarea
            id={id + '-header'}
            rows={2}
            maxLength={500}
            value={draft.header}
            onChange={(e) => update('header', e.target.value)}
          />
          <label htmlFor={id + '-body'}>Body</label>
          <textarea
            id={id + '-body'}
            rows={10}
            required
            maxLength={20000}
            value={draft.body}
            onChange={(e) => update('body', e.target.value)}
            aria-describedby={id + '-body-help'}
          />
          <p className="note" id={id + '-body-help'}>
            {draft.body.length.toLocaleString('en-GB')} / 20,000 characters
          </p>
          <label htmlFor={id + '-footer'}>
            Footer <span className="field-optional">(optional)</span>
          </label>
          <textarea
            id={id + '-footer'}
            rows={2}
            maxLength={500}
            value={draft.footer}
            onChange={(e) => update('footer', e.target.value)}
          />
        </fieldset>
        {problem && (
          <p className="error" role="alert" tabIndex={-1} ref={failureNotice}>
            {problem}
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={pending || stale}>
            {pending ? 'Saving…' : original ? 'Save changes' : 'Save note'}
          </button>
          <button type="button" className="secondary" disabled={pending} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
