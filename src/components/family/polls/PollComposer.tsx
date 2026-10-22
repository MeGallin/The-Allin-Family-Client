import { useId, useRef, useState, type FormEvent } from 'react'
import type { FamilyPollRecord } from '../../../features/polls/types'
import { usePolls } from '../../../features/polls/usePolls'
import { Modal } from '../../ui/Modal'
import './PollComposer.css'
import { useDraftGuard } from '../../../features/drafts/DraftProtection'
import { DraftConflict } from '../../ui/DraftConflict'
export default function PollComposer({
  poll,
  onClose,
}: {
  poll?: FamilyPollRecord
  onClose: () => void
}) {
  const { add, edit, pending, error, polls, clearError } = usePolls()
  const [original, setOriginal] = useState(poll)
  const [title, setTitle] = useState(poll?.title ?? '')
  const [detail, setDetail] = useState(poll?.detail ?? '')
  const [options, setOptions] = useState(poll?.options.map((option) => option.label) ?? ['', ''])
  const [baseline, setBaseline] = useState({
    title: poll?.title ?? '',
    detail: poll?.detail ?? '',
    options: poll?.options.map((option) => option.label) ?? ['', ''],
  })
  const guard = useDraftGuard(
    JSON.stringify({ title, detail, options }) !== JSON.stringify(baseline),
    pending,
  )
  const close = () => guard.close(onClose)
  const addition = useRef<{ signature: string; key: string } | null>(null)
  const [problem, setProblem] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  const id = useId()
  const latest = original && polls.find((entry) => entry.id === original.id)
  const stale = !!original && (!latest || latest.version !== original.version)
  function addChoice() {
    const nextIndex = options.length
    setOptions((current) => [...current, ''])
    requestAnimationFrame(() => document.getElementById(id + '-option-' + nextIndex)?.focus())
  }
  function removeChoice(index: number) {
    setOptions((current) => current.filter((_, position) => position !== index))
    requestAnimationFrame(() =>
      document.getElementById(id + '-option-' + Math.min(index, options.length - 2))?.focus(),
    )
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || stale) return
    const choices = options.map((value) => value.trim())
    if (!title.trim() || choices.some((choice) => !choice)) {
      setProblem('Add a question and fill in each choice.')
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    if (
      !original &&
      new Set(choices.map((value) => value.toLocaleLowerCase())).size !== choices.length
    ) {
      setProblem('Give each choice a different name.')
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setProblem('')
    const draft = { title: title.trim(), detail: detail.trim(), options: choices }
    const signature = JSON.stringify(draft)
    if (!addition.current || addition.current.signature !== signature)
      addition.current = { signature, key: crypto.randomUUID() }
    const saved = original ? await edit(original, draft) : await add(draft, addition.current.key)
    if (saved) guard.complete(onClose)
    else requestAnimationFrame(() => errorRef.current?.focus())
  }
  return (
    <Modal title={original ? 'Edit family poll' : 'Ask the family'} busy={pending} onClose={close}>
      <p className="note">
        Everyone in the family can vote and see the totals. Administrators can see voting activity,
        including who voted and changed their choice.
      </p>
      {stale && latest && (
        <DraftConflict
          key={latest.version}
          before={{ title: baseline.title, detail: baseline.detail }}
          mine={{ title, detail }}
          latest={{ title: latest.title, detail: latest.detail }}
          labels={{ title: 'Question', detail: 'Details' }}
          onResolve={(merged) => {
            setOriginal(latest)
            setBaseline({
              title: latest.title,
              detail: latest.detail,
              options: latest.options.map((option) => option.label),
            })
            setTitle(merged.title)
            setDetail(merged.detail)
            setOptions(latest.options.map((option) => option.label))
            setProblem('')
            clearError()
          }}
        />
      )}
      <form onSubmit={(event) => void save(event)} className="poll-composer">
        <label htmlFor={id + '-title'}>Question</label>
        <input
          id={id + '-title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
          disabled={pending}
        />
        <label htmlFor={id + '-detail'}>Details (optional)</label>
        <textarea
          id={id + '-detail'}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={1000}
          rows={3}
          disabled={pending}
        />
        <fieldset disabled={pending}>
          <legend>Choices</legend>
          {options.map((option, index) => (
            <div className="poll-composer__option" key={index}>
              <label htmlFor={id + '-option-' + index}>{'Choice ' + (index + 1)}</label>
              <div>
                <input
                  id={id + '-option-' + index}
                  value={option}
                  onChange={(e) =>
                    setOptions((current) =>
                      current.map((value, position) =>
                        position === index ? e.target.value : value,
                      ),
                    )
                  }
                  maxLength={80}
                  required
                  readOnly={!!original}
                />
                {!original && options.length > 2 && (
                  <button
                    type="button"
                    className="secondary"
                    aria-label={'Remove choice ' + (index + 1)}
                    onClick={() => removeChoice(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {!original && options.length < 6 && (
            <button type="button" className="secondary" onClick={addChoice}>
              Add another choice
            </button>
          )}
        </fieldset>
        <p className="note">
          Choices stay fixed once a poll is created, so existing votes keep their meaning. You can
          edit the question and details.
        </p>
        {(stale || problem || error) && (
          <p ref={errorRef} role="alert" tabIndex={-1} className="error">
            {stale
              ? latest
                ? 'Review newer changes above before saving.'
                : 'This poll was removed. Your draft is kept here so you can copy it before closing.'
              : problem || error}
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={pending || stale}>
            {pending ? 'Saving…' : original ? 'Save changes' : 'Share poll'}
          </button>
          <button type="button" className="secondary" disabled={pending} onClick={close}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
