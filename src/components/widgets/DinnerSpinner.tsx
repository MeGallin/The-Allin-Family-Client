import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, LockKeyhole, RotateCw, Send } from 'lucide-react'
import type { DinnerSpin, FamilyWidget } from '../../features/widgets/types'
import { Icon } from '../ui/Icon'
import { WidgetHelp } from '../ui/WidgetHelp'
import { FriendlyTime } from '../ui/FriendlyTime'
import { DinnerWheel } from './DinnerWheel'
import { LoadingState } from '../ui/LoadingState'
import './DinnerSpinner.css'
const PublishDinner = lazy(() => import('./PublishDinner'))
// Keep a saved trial aligned with the pointer when reopening the installation.
function trialRotation(widget: FamilyWidget, spin?: DinnerSpin) {
  const index = widget.meals.findIndex((meal) => meal.id === spin?.mealId)
  return index < 0 ? 0 : (360 - ((index + 0.5) * 360) / widget.meals.length) % 360
}
export function DinnerSpinner({
  widget,
  disabled,
  onSpin,
  onViewMeals,
}: {
  widget: FamilyWidget
  disabled: boolean
  onViewMeals?: () => void
  onSpin: (key: string) => Promise<DinnerSpin | null>
}) {
  const [rotation, setRotation] = useState(() => trialRotation(widget, widget.spins[0])),
    [animating, setAnimating] = useState(false)
  const [displayed, setDisplayed] = useState(widget.spins[0])
  const [spinError, setSpinError] = useState('')
  const [repeated, setRepeated] = useState(false)
  const [publishing, setPublishing] = useState<DinnerSpin | null>(null)
  const retry = useRef<{ version: number; key: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true),
    running = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])
  useEffect(() => {
    if (!running.current) {
      setDisplayed(widget.spins[0])
      const target = trialRotation(widget, widget.spins[0])
      setRotation((previous) => Math.floor(previous / 360) * 360 + target)
    }
  }, [widget.spins, widget.meals])
  const available =
    !!displayed &&
    widget.meals.some(
      (meal) =>
        meal.id === displayed.mealId &&
        meal.title === displayed.meal &&
        meal.version === displayed.mealVersion,
    )
  async function spin() {
    if (disabled || running.current || widget.meals.length < 2) return
    running.current = true
    setAnimating(true)
    setSpinError('')
    try {
      if (!retry.current || retry.current.version !== widget.version)
        retry.current = { version: widget.version, key: crypto.randomUUID() }
      const selection = await onSpin(retry.current.key)
      if (!mounted.current) return
      if (!selection) {
        running.current = false
        setAnimating(false)
        setSpinError(
          'We couldn’t confirm this spin. Your last confirmed pick is kept. Try again to recover the saved result.',
        )
        return
      }
      retry.current = null
      const target = trialRotation(widget, selection)
      setRotation((previous) => previous + 1080 + ((target - (previous % 360) + 360) % 360))
      timer.current = setTimeout(
        () => {
          setRepeated(displayed?.mealId === selection.mealId)
          setDisplayed(selection)
          running.current = false
          setAnimating(false)
        },
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 2050,
      )
    } catch {
      if (mounted.current) {
        running.current = false
        setAnimating(false)
        setSpinError(
          'We couldn’t finish this spin. Your last confirmed pick is kept. Please try again.',
        )
      }
    }
  }
  return (
    <section className="dinner-spinner" aria-label={widget.title}>
      <WidgetHelp>
        <p>Try meal ideas privately, then share a chosen meal when you are ready.</p>
        <ol>
          <li>
            <strong>Check the meal choices.</strong> View meals shows what is on this wheel. Only
            its owner can change its meals and Personal/Family visibility in Widget settings. At
            least two meals are needed to spin.
          </li>
          <li>
            <strong>Spin for an idea.</strong> Choose Spin for dinner, then Spin again if you want
            another try. Every meal has an equal chance on each independent spin, so the same meal
            can appear again. Trials are saved privately to you, even on a Family wheel. You can
            spin as often as you like; spinning does not change the family choice.
          </li>
          <li>
            <strong>Publish a choice deliberately.</strong> On a Family wheel, choose Publish this
            pick. Select Breakfast, Lunch, Dinner or Other and the Meal date, review the choice,
            then confirm Publish to family. The family sees the meal, your nickname and publication
            time. Personal wheels cannot publish. If the meal list changed, spin from the current
            choices.
          </li>
          <li>
            <strong>Respond to the published meal.</strong> Open the family suggestion and choose
            Happy with that or Suggest another; Clear my response removes your reply. Replies are
            optional. No reply is not a vote, and the published choice stands until it is changed.
            Suggest another does not spin or replace the meal automatically.
          </li>
          <li>
            <strong>Replace a suggestion when needed.</strong> Publish a new trial for the same date
            and meal slot, review the existing choice and confirm the replacement. Old replies stay
            with the previous suggestion; the replacement starts with no replies. Use Published meal
            to select among available choices and Previous suggestions to review replacements.
          </li>
          <li>
            <strong>Keep the diary accurate.</strong> After a meal on its date or later, choose Mark
            as eaten. This records it in the seven-day meal diary and locks its replies. Correct
            eaten record reverses that record so it can be corrected or replaced. Open a diary meal
            to see its suggestion and responses; an empty day means no meal was recorded, not that
            nobody ate.
          </li>
        </ol>
        <p>
          Spins, publications and replies save when you use their controls. Watch for errors and
          confirmed results. A failed spin keeps your last confirmed pick; retry to recover the
          saved result. Removing the installation uses confirmation and the shared 20-second Undo
          countdown; it is separate from trying another spin.
        </p>
      </WidgetHelp>
      <div className="dinner-spinner__stage">
        <DinnerWheel meals={widget.meals} rotation={rotation} />
        <div className="dinner-spinner__intro">
          <div className="dinner-spinner__actions">
            <button
              type="button"
              disabled={disabled || animating || widget.meals.length < 2}
              onClick={() => void spin()}
            >
              <Icon icon={RotateCw} />
              {animating ? 'Choosing dinner…' : displayed ? 'Spin again' : 'Spin for dinner'}
            </button>
            {onViewMeals && (
              <button type="button" className="text-button" onClick={onViewMeals}>
                View meals <Icon icon={ChevronRight} />
              </button>
            )}
          </div>
        </div>
      </div>
      {widget.meals.length < 2 && (
        <p className="note" role="status">
          This wheel needs at least two meals. Its owner can add them in Widget settings.
        </p>
      )}
      {spinError && (
        <p className="error" role="alert">
          {spinError}
        </p>
      )}
      <div
        className={'dinner-spinner__result' + (displayed ? ' has-pick' : '')}
        role="status"
        aria-live="polite"
      >
        <div>
          <p className="eyebrow">
            {animating
              ? 'Choosing privately'
              : displayed
                ? 'Your private trial'
                : 'Only you can see this'}
          </p>
          <h3>{animating ? 'Round we go…' : (displayed?.meal ?? 'What’s for dinner?')}</h3>
          <p className="note">
            {!animating && displayed ? (
              <>
                Only you can see this trial · <FriendlyTime value={displayed.occurredAt} />
              </>
            ) : (
              'Every meal has an equal chance.'
            )}
          </p>
        </div>
        <Icon icon={LockKeyhole} />
      </div>
      {displayed && !animating && widget.visibility === 'family' && (
        <div className="dinner-spinner__publish">
          <p className="note">
            {!available
              ? 'This meal changed or was removed. Spin again from the current choices.'
              : repeated
                ? 'Same meal again? Every spin is independent. Keep it or try another spin.'
                : 'Happy with this pick? Publish it so the family can respond.'}
          </p>
          <button
            type="button"
            className="secondary"
            disabled={
              disabled ||
              !available ||
              widget.publications.some((publication) => publication.spinId === displayed.id)
            }
            onClick={() => setPublishing(displayed)}
          >
            <Icon
              icon={
                widget.publications.some((publication) => publication.spinId === displayed.id)
                  ? Check
                  : Send
              }
            />
            {widget.publications.some((publication) => publication.spinId === displayed.id)
              ? 'This trial was published'
              : 'Publish this pick'}
          </button>
        </div>
      )}
      {widget.visibility === 'private' && (
        <p className="note dinner-spinner__disclaimer">
          Only you can see this wheel and its trials.
        </p>
      )}
      {publishing && (
        <Suspense fallback={<LoadingState label="Opening your dinner suggestion…" />}>
          <PublishDinner widget={widget} spin={publishing} onClose={() => setPublishing(null)} />
        </Suspense>
      )}
    </section>
  )
}
