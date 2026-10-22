import { RemovalDelayHint } from '../../removals/RemovalDelayHint'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useCalendar } from '../../../features/calendar/useCalendar'
import type { FamilyEvent } from '../../../features/calendar/types'
import { dateInputValue, eventDate } from '../../../lib/dates'
import { Modal } from '../../ui/Modal'
import './EventComposer.css'
import { useDraftGuard } from '../../../features/drafts/DraftProtection'
import { DraftConflict } from '../../ui/DraftConflict'

const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
function fields(event?: FamilyEvent) {
  const date = event ? eventDate({ startsAt: event.startsAt, allDay: event.allDay }) : new Date()
  return {
    title: event?.title ?? '',
    day: dateInputValue(date),
    time: event
      ? String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
      : '12:00',
    detail: event?.detail ?? '',
    allDay: event?.allDay ?? false,
    annually: event?.annually ?? false,
  }
}
export default function EventComposer({
  onClose,
  event,
}: {
  onClose: () => void
  event?: FamilyEvent
}) {
  const { events, add, edit, remove, pending, error, failure, clearError, refresh, loading } =
    useCalendar()
  const [original, setOriginal] = useState(event)
  const [baseline, setBaseline] = useState(() => fields(event))
  const [draft, setDraft] = useState(baseline)
  const guard = useDraftGuard(JSON.stringify(draft) !== JSON.stringify(baseline), pending)
  const [validation, setValidation] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [restoreFocus, setRestoreFocus] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const removeRef = useRef<HTMLButtonElement>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  const id = useId()
  const latest = original ? events.find((item) => item.id === original.id) : undefined
  const stale = !!original && (!latest || latest.version !== original.version)
  useEffect(() => {
    if (confirmRemove) keepRef.current?.focus()
    else if (wasConfirming.current) removeRef.current?.focus()
    wasConfirming.current = confirmRemove
  }, [confirmRemove])
  useEffect(() => {
    clearError()
  }, [clearError])
  useEffect(() => {
    if (!pending && restoreFocus) {
      titleRef.current?.focus()
      setRestoreFocus(false)
    }
  }, [pending, restoreFocus])
  function close() {
    if (!pending) guard.close(onClose)
  }
  async function submit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    if (pending || stale) return
    // Read native date/time controls at submit as well as keeping a controlled draft.
    // This covers date-picker/autofill changes that do not emit React's change event.
    const form = new FormData(submitEvent.currentTarget)
    const day = String(form.get('day') ?? draft.day)
    const time = String(form.get('time') ?? draft.time)
    const date = new Date(day + 'T' + time)
    const expected =
      dateInputValue(date) +
      'T' +
      String(date.getHours()).padStart(2, '0') +
      ':' +
      String(date.getMinutes()).padStart(2, '0')
    if (
      !draft.title.trim() ||
      Number.isNaN(date.getTime()) ||
      (!draft.allDay && expected !== day + 'T' + time)
    ) {
      setValidation(
        'Choose a title and valid local date and time. This time may fall in a daylight-saving clock change.',
      )
      return
    }
    setValidation('')
    const originalFields = fields(original)
    const timeUnchanged =
      original &&
      draft.allDay === original.allDay &&
      day === originalFields.day &&
      (draft.allDay || time === originalFields.time)
    const body = {
      title: draft.title.trim(),
      startsAt: timeUnchanged
        ? original.startsAt
        : draft.allDay
          ? day + 'T00:00:00.000Z'
          : date.toISOString(),
      allDay: draft.allDay,
      annually: draft.annually,
      timeZone: timeUnchanged ? original.timeZone : localZone(),
      detail: draft.detail.trim(),
    }
    if (await (original ? edit(original, body) : add(body))) guard.complete(onClose)
    else setRestoreFocus(true)
  }
  async function removeEvent() {
    if (!original || pending || stale) return
    if (await remove(original)) guard.complete(onClose)
    else {
      setConfirmRemove(false)
      setRestoreFocus(true)
    }
  }
  return (
    <Modal title={original ? 'Edit family event' : 'Make a plan'} onClose={close} busy={pending}>
      <p className="note">
        Saved for everyone in the family. Times are shown in your time zone: {localZone()}.
      </p>
      {stale && latest && (
        <DraftConflict
          key={latest.version}
          before={baseline}
          mine={draft}
          latest={fields(latest)}
          labels={{
            title: 'Event title',
            day: 'Date',
            time: 'Time',
            detail: 'Details',
            allDay: 'All day',
            annually: 'Repeat every year',
          }}
          onResolve={(merged) => {
            setOriginal(latest)
            setBaseline(fields(latest))
            setDraft(merged)
            setValidation('')
            clearError()
            setConfirmRemove(false)
            titleRef.current?.focus()
          }}
        />
      )}
      {stale && !latest && (
        <p role="alert" className="error">
          This event was removed. Your draft is kept here so you can copy your writing before
          closing.
        </p>
      )}
      <form onSubmit={submit} aria-busy={pending}>
        <label htmlFor={id + '-title'}>What’s the plan?</label>
        <input
          ref={titleRef}
          id={id + '-title'}
          required
          maxLength={80}
          disabled={pending}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <label className="event-composer__all-day">
          <input
            type="checkbox"
            checked={draft.allDay}
            disabled={pending}
            onChange={(e) =>
              setDraft({
                ...draft,
                allDay: e.target.checked,
                annually: e.target.checked && draft.annually,
              })
            }
          />
          All day
        </label>
        <label className="event-composer__all-day">
          <input
            type="checkbox"
            checked={draft.annually}
            disabled={pending}
            onChange={(e) =>
              setDraft({
                ...draft,
                annually: e.target.checked,
                allDay: e.target.checked || draft.allDay,
              })
            }
          />
          Repeat every year
        </label>
        {draft.annually && (
          <p className="note">
            Repeats on this date as an all-day event. Changes and removal apply to every year. A 29
            February birthday appears on 28 February in other years.
          </p>
        )}
        <div className="event-composer__when">
          <div>
            <label htmlFor={id + '-day'}>Date</label>
            <input
              id={id + '-day'}
              type="date"
              name="day"
              required
              min="1000-01-01"
              max="9998-12-31"
              disabled={pending}
              value={draft.day}
              onChange={(e) => setDraft({ ...draft, day: e.target.value })}
              onInput={(e) => {
                const day = e.currentTarget.value
                setDraft((current) => ({ ...current, day }))
              }}
            />
          </div>
          {!draft.allDay && (
            <div>
              <label htmlFor={id + '-time'}>Time</label>
              <input
                id={id + '-time'}
                type="time"
                name="time"
                required
                disabled={pending}
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                onInput={(e) => {
                  const time = e.currentTarget.value
                  setDraft((current) => ({ ...current, time }))
                }}
              />
            </div>
          )}
        </div>
        <label htmlFor={id + '-detail'}>
          Anything to know <span className="field-optional">(optional)</span>
        </label>
        <textarea
          id={id + '-detail'}
          rows={3}
          maxLength={300}
          disabled={pending}
          value={draft.detail}
          onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
        />
        {(validation || error) && (
          <p className="error" role="alert">
            {validation || error}
          </p>
        )}
        {failure?.status === 409 && !stale && (
          <button type="button" className="button-link" onClick={refresh} disabled={pending}>
            Refresh latest event
          </button>
        )}
        <div className="actions">
          <button type="submit" disabled={pending || loading || stale || !draft.title.trim()}>
            {pending ? 'Saving…' : original ? 'Save changes' : 'Add event'}
          </button>
          <button type="button" className="secondary" disabled={pending} onClick={close}>
            Cancel
          </button>
        </div>
      </form>
      {original && !stale && (
        <div className="event-composer__remove">
          <RemovalDelayHint />
          {confirmRemove ? (
            <>
              <p>
                Remove “{original.title}” from everyone’s calendar? Its activity history will be
                kept.
              </p>
              <div className="actions">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => guard.close(() => void removeEvent())}
                >
                  {pending ? 'Removing…' : 'Yes, remove event'}
                </button>
                <button
                  ref={keepRef}
                  type="button"
                  className="secondary"
                  disabled={pending}
                  onClick={() => setConfirmRemove(false)}
                >
                  Keep event
                </button>
              </div>
            </>
          ) : (
            <button
              ref={removeRef}
              type="button"
              className="button-link"
              disabled={pending}
              onClick={() => setConfirmRemove(true)}
            >
              Remove event
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
