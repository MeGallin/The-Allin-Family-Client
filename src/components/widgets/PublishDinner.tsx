import { mealDateRange, mealToday } from '../../features/widgets/meal-calendar'
import { useSearchParams } from 'react-router'
import { useRef, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import type { DinnerSpin, FamilyWidget, MealType } from '../../features/widgets/types'
import { useWidgets } from '../../features/widgets/useWidgets'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { useNow } from '../../hooks/useNow'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { mealTypes } from '../../features/widgets/meal-diary'
import './PublishDinner.css'

export default function PublishDinner({
  widget,
  spin,
  onClose,
}: {
  widget: FamilyWidget
  spin: DinnerSpin
  onClose: () => void
}) {
  const [, setSearch] = useSearchParams()
  const { publish, pending, offline, error, clearError, refresh } = useWidgets()
  const now = useNow()
  const dateRange = mealDateRange(now)
  const [originalDate] = useState(() => mealToday(now))
  const [date, setDate] = useState(originalDate)
  const [mealType, setMealType] = useState<MealType>('dinner')
  const latest = widget.publications.find(
    (publication) =>
      publication.current && publication.forDate === date && publication.mealType === mealType,
  )
  const alreadyPublished = widget.publications.some((publication) => publication.spinId === spin.id)
  const [baseline, setBaseline] = useState({
    version: widget.version,
  })
  const stale = baseline.version !== widget.version
  const available =
    widget.visibility === 'family' &&
    widget.meals.some(
      (meal) =>
        meal.id === spin.mealId && meal.title === spin.meal && meal.version === spin.mealVersion,
    )
  const guard = useDraftGuard(date !== originalDate || mealType !== 'dinner', pending)
  const retry = useRef<{ signature: string; key: string } | null>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || offline || stale || !available || alreadyPublished || latest?.eatenAt) return
    clearError()
    const signature = JSON.stringify([spin.id, date, mealType, baseline])
    if (!retry.current || retry.current.signature !== signature)
      retry.current = { signature, key: crypto.randomUUID() }
    if (
      await publish(
        { ...widget, version: baseline.version },
        spin.id,
        date,
        mealType,
        latest?.id ?? null,
        retry.current.key,
      )
    )
      guard.complete(() => {
        onClose()
        setSearch((previous) => {
          const next = new URLSearchParams(previous)
          next.set('view', 'family')
          next.set('widget', widget.id)
          next.delete('meal')
          next.set('mealDate', date)
          next.set('mealType', mealType)
          return next
        })
      })
  }
  return (
    <Modal
      title={latest ? 'Replace this meal choice?' : 'Publish a meal choice'}
      busy={pending}
      onClose={() => guard.close(onClose)}
      scrollable
    >
      <div className="publish-dinner__choice">
        <p className="eyebrow">Your selected trial</p>
        <h3>{spin.meal}</h3>
        <p className="note">
          The family will see this meal, your nickname and when you published it.
        </p>
      </div>
      {alreadyPublished && (
        <div className="publish-dinner__conflict" role="status">
          <p>
            This trial pick has already been published. Your saved suggestion has not been
            duplicated.
          </p>
          <button type="button" className="secondary" onClick={() => guard.complete(onClose)}>
            View published suggestions
          </button>
        </div>
      )}
      {latest && !alreadyPublished && (
        <div className="publish-dinner__previous">
          <span className="note">Current family suggestion</span>
          <strong>{latest.meal}</strong>
          <p className="note">
            Its replies will stay in history. The new suggestion starts with no replies.
          </p>
        </div>
      )}
      {!available && !alreadyPublished && (
        <p className="error" role="alert">
          This meal or installation changed. Close this dialog, check Family visibility and spin
          again from the current meal list.
        </p>
      )}
      {latest?.eatenAt && (
        <p className="error" role="alert">
          This meal is recorded as eaten. Correct its diary record before replacing it.
        </p>
      )}
      {stale && !alreadyPublished && (
        <div className="publish-dinner__conflict" role="alert">
          <p>
            The installation or published suggestion changed. Review the current suggestion above
            before continuing.
          </p>
          <button
            type="button"
            className="secondary"
            disabled={pending}
            onClick={() => {
              setBaseline({ version: widget.version })
              clearError()
            }}
          >
            I’ve reviewed the latest suggestion
          </button>
        </div>
      )}
      <form onSubmit={submit} className="publish-dinner__form" aria-busy={pending}>
        <label htmlFor="dinner-meal-type">Which meal?</label>
        <select
          id="dinner-meal-type"
          value={mealType}
          disabled={pending}
          onChange={(event) => setMealType(event.target.value as MealType)}
        >
          {mealTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <label htmlFor="dinner-publication-date">Meal date</label>
        <input
          id="dinner-publication-date"
          required
          type="date"
          min={dateRange.min}
          max={dateRange.max}
          value={date}
          disabled={pending}
          onChange={(event) => setDate(event.target.value)}
        />
        <p className="note">
          This becomes the meal choice unless someone requests another suggestion. Replies are
          optional; silence is not recorded as a vote.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {error && (
          <button type="button" className="text-button" disabled={pending} onClick={refresh}>
            Check saved changes
          </button>
        )}
        <div className="actions">
          <button
            type="submit"
            disabled={
              pending || offline || stale || !available || alreadyPublished || !!latest?.eatenAt
            }
          >
            <Icon icon={Send} />
            {pending ? 'Publishing…' : latest ? 'Replace family suggestion' : 'Publish to family'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={pending}
            onClick={() => guard.close(onClose)}
          >
            Keep spinning privately
          </button>
        </div>
      </form>
    </Modal>
  )
}
