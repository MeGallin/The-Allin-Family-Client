import { validateWidget, widgetText } from '../../features/widgets/widget-validation'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useWidgets } from '../../features/widgets/useWidgets'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import type { FamilyWidget, WidgetDraft, WidgetMeal } from '../../features/widgets/types'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import './WidgetComposer.css'
const fields = (widget?: FamilyWidget): WidgetDraft => ({
  title: widget?.title ?? '',
  visibility: widget?.visibility ?? 'private',
  meals: widget?.meals.map(({ id, title }) => ({ id, title })) ?? [{ title: '' }, { title: '' }],
})
export default function WidgetComposer({
  widget,
  onClose,
  onSaved,
  onRemoveMeal,
}: {
  widget?: FamilyWidget
  onClose: () => void
  onSaved: () => void
  onRemoveMeal: (meal: WidgetMeal) => void
}) {
  const { widgets, add, edit, pending, offline, error, clearError, refresh } = useWidgets()
  const [original, setOriginal] = useState(widget),
    [baseline, setBaseline] = useState(() => fields(widget))
  const [draft, setDraft] = useState(baseline),
    [validation, setValidation] = useState('')
  const [validationField, setValidationField] = useState('')
  const guard = useDraftGuard(JSON.stringify(draft) !== JSON.stringify(baseline), pending)
  const addition = useRef<{ signature: string; key: string } | null>(null)
  const latest = original ? widgets.find((item) => item.id === original.id) : undefined
  const stale = !!original && (!latest || latest.version !== original.version)
  const id = useId()
  function updateDraft(next: WidgetDraft) {
    setDraft(next)
    setValidation('')
    setValidationField('')
    clearError()
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || stale || offline) return
    clearError()
    setValidation('')
    setValidationField('')
    const invalid = validateWidget(draft)
    if (invalid) {
      setValidation(invalid.message)
      setValidationField(invalid.field)
      document.getElementById(id + '-' + invalid.field)?.focus()
      return
    }
    const body = {
      ...draft,
      title: widgetText(draft.title),
      meals: draft.meals.map((meal) => ({ ...meal, title: widgetText(meal.title) })),
    }
    const signature = JSON.stringify(body)
    if (!addition.current || addition.current.signature !== signature)
      addition.current = { signature, key: crypto.randomUUID() }
    if (original ? await edit(original, body) : await add(body, addition.current.key))
      guard.complete(onSaved)
  }
  return (
    <Modal
      title={original ? 'Your wheel, your choices' : 'Make it your own'}
      onClose={() => guard.close(onClose)}
      busy={pending}
      scrollable
    >
      <p className="note">
        You manage the meals. Family installations let everyone spin privately, publish a suggestion
        and respond together.
      </p>
      {stale && (
        <div role="alert" className="widget-composer__conflict">
          <p>This widget changed or was removed in another window. Your draft is kept here.</p>
          {latest && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setOriginal(latest)
                const next = fields(latest)
                updateDraft(next)
                setBaseline(next)
                clearError()
              }}
            >
              Discard draft and load latest
            </button>
          )}
        </div>
      )}
      <form noValidate className="widget-composer" onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending}>
          <label htmlFor={id + '-title'}>Widget name</label>
          <input
            id={id + '-title'}
            aria-describedby={validation ? id + '-validation' : undefined}
            required
            aria-invalid={validationField === 'title'}
            maxLength={120}
            value={draft.title}
            onChange={(e) => updateDraft({ ...draft, title: e.target.value })}
            placeholder="For example, Dinner at home"
          />
          <div className="widget-composer__meal-heading">
            <h3>Meal choices</h3>
            <span className="note">{draft.meals.length} / 12</span>
          </div>
          <p className="note">
            Every meal has an equal chance. Add between 2 and 12 different choices.
          </p>
          <div className="widget-composer__meals">
            {draft.meals.map((meal, index) => (
              <div className="widget-composer__meal" key={meal.id ?? 'new-' + index}>
                <label className="sr-only" htmlFor={id + '-meal-' + index}>
                  Meal {index + 1}
                </label>
                <input
                  id={id + '-meal-' + index}
                  aria-describedby={validation ? id + '-validation' : undefined}
                  required
                  aria-invalid={validationField === 'meal-' + index}
                  maxLength={80}
                  value={meal.title}
                  placeholder={'Meal ' + (index + 1)}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      meals: draft.meals.map((item, i) =>
                        i === index ? { ...item, title: e.target.value } : item,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={'Remove meal ' + (meal.title || index + 1)}
                  disabled={
                    draft.meals.length <= 2 ||
                    (!!meal.id && (original?.meals.length ?? 0) <= 2) ||
                    stale
                  }
                  title={
                    meal.id && (original?.meals.length ?? 0) <= 2
                      ? 'Save another meal before removing one of the last two choices.'
                      : undefined
                  }
                  onClick={() => {
                    const existing = original?.meals.find((item) => item.id === meal.id)
                    if (existing) guard.close(() => onRemoveMeal(existing))
                    else updateDraft({ ...draft, meals: draft.meals.filter((_, i) => i !== index) })
                  }}
                >
                  <Icon icon={Trash2} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="secondary"
            disabled={draft.meals.length >= 12}
            onClick={() => updateDraft({ ...draft, meals: [...draft.meals, { title: '' }] })}
          >
            <Icon icon={Plus} />
            Add a meal
          </button>
          <fieldset className="widget-composer__visibility">
            <legend>Install for</legend>
            {(['private', 'family'] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name={id + '-visibility'}
                  value={value}
                  checked={draft.visibility === value}
                  onChange={() => updateDraft({ ...draft, visibility: value })}
                />
                <span>
                  <strong>{value === 'private' ? 'Personal' : 'Family'}</strong>
                  <small>
                    {value === 'private'
                      ? 'Only you can see it'
                      : 'Shared meals and published suggestions'}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
        </fieldset>
        {(validation || error) && (
          <p id={id + '-validation'} className="error" role="alert">
            {validation || error}
          </p>
        )}
        {error && (
          <button type="button" className="text-button" disabled={pending} onClick={refresh}>
            Check saved changes
          </button>
        )}
        <div className="actions">
          <button type="submit" disabled={pending || stale || offline}>
            {pending ? 'Saving…' : original ? 'Save choices' : 'Install widget'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={pending}
            onClick={() => guard.close(onClose)}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
