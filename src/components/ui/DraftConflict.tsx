import { useId, useState } from 'react'
import './DraftConflict.css'

type Fields = Record<string, string | boolean>
/** Three-way field merge: unchanged draft fields adopt the server's version. */
export function DraftConflict<T extends Fields>({
  before,
  mine,
  latest,
  labels,
  onResolve,
}: {
  before: T
  mine: T
  latest: T
  labels: Partial<Record<keyof T, string>>
  onResolve: (merged: T) => void
}) {
  const id = useId()
  const [choices, setChoices] = useState<Record<string, 'mine' | 'latest'>>({})
  const keys = Object.keys(latest) as (keyof T & string)[]
  const overlaps = keys.filter(
    (key) => mine[key] !== before[key] && latest[key] !== before[key] && mine[key] !== latest[key],
  )
  const display = (value: string | boolean) =>
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '(empty)'
  return (
    <section className="draft-conflict" aria-labelledby={id}>
      <h3 id={id}>Review newer changes</h3>
      <p className="note">
        The saved version changed. Your draft is still here. Fields you did not edit will use the
        latest saved values.
      </p>
      {overlaps.map((key) => (
        <fieldset key={key}>
          <legend>{labels[key] ?? key}</legend>
          {(['mine', 'latest'] as const).map((choice) => (
            <label className="draft-conflict__choice" key={choice}>
              <span>
                <input
                  type="radio"
                  name={id + key}
                  checked={choices[key] === choice}
                  onChange={() => setChoices({ ...choices, [key]: choice })}
                />
                {choice === 'mine' ? 'Keep my draft' : 'Use latest saved'}
              </span>
              <span className="draft-conflict__value">
                {display((choice === 'mine' ? mine : latest)[key])}
              </span>
            </label>
          ))}
        </fieldset>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={overlaps.some((key) => !choices[key])}
        onClick={(event) => {
          const editor = event.currentTarget.closest('dialog, form')
          const merged = { ...latest }
          for (const key of keys)
            if (mine[key] !== before[key] && choices[key] !== 'latest') merged[key] = mine[key]
          onResolve(merged)
          requestAnimationFrame(() =>
            editor?.querySelector<HTMLElement>('input:not([type=radio]), textarea')?.focus(),
          )
        }}
      >
        Continue editing
      </button>
      <p className="note">Nothing is saved until you review the form and save again.</p>
    </section>
  )
}
