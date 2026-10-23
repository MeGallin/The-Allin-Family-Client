import { useState, type FormEvent } from 'react'
import { TrainFront, Check, Minus } from 'lucide-react'
import { travelApi } from '../../services/travel-query'
import { shoppingError } from '../../services/shopping-query'
import type { TravelPreferences } from '../../features/travel/types'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { Icon } from '../ui/Icon'
import { LoadingState } from '../ui/LoadingState'
import { TravelLineSwatch } from '../family/travel/TravelLineLabel'
import './TravelPreferencesForm.css'

export function TravelPreferencesForm() {
  const query = travelApi.useGetTravelPreferencesQuery()
  if (query.isLoading) return <LoadingState label="Loading your travel choices…" />
  return (
    <>
      <p className="note">
        Follow the TfL lines you use. Your choices follow your account on every device.
      </p>
      {query.data && <TravelEditor preferences={query.data} />}
      {query.isError && (
        <div role="alert">
          <p className="error">
            {shoppingError(query.error)?.message ?? 'Travel choices are unavailable.'}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              void query.refetch()
            }}
          >
            Reload travel choices
          </button>
        </div>
      )}
    </>
  )
}

function TravelEditor({ preferences }: { preferences: TravelPreferences }) {
  const [baseline, setBaseline] = useState(preferences)
  const [lines, setLines] = useState(preferences.lines)
  const [feedback, setFeedback] = useState('')
  const [save, mutation] = travelApi.useSaveTravelPreferencesMutation()
  const dirty = [...lines].sort().join(',') !== [...baseline.lines].sort().join(',')
  const guard = useDraftGuard(dirty, mutation.isLoading)
  const conflict = preferences.version > baseline.version
  const allSelected =
    preferences.availableLines.length > 0 &&
    preferences.availableLines.every((line) => lines.includes(line.id))
  const partiallySelected =
    !allSelected && preferences.availableLines.some((line) => lines.includes(line.id))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isLoading || conflict || !dirty) return
    setFeedback('')
    try {
      const saved = await save({ lines, version: baseline.version }).unwrap()
      guard.complete(() => {
        setBaseline(saved)
        setLines(saved.lines)
      })
      setFeedback(
        saved.lines.length
          ? 'Saved. Your calendar will show disruptions for these lines.'
          : 'Saved. Travel indicators are switched off.',
      )
    } catch {
      /* Preserve choices and display mutation error. */
    }
  }
  return (
    <form className="travel-preferences" onSubmit={submit}>
      <div className="travel-preferences__summary">
        <Icon icon={TrainFront} />
        <span>
          <strong>Your regular lines</strong>
          <small>{lines.length ? `${lines.length} selected` : 'Travel indicators off'}</small>
        </span>
        <label className="travel-preferences__all">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = partiallySelected
            }}
            disabled={mutation.isLoading || !preferences.availableLines.length}
            onChange={(event) => {
              setLines(
                event.target.checked ? preferences.availableLines.map((line) => line.id) : [],
              )
              setFeedback('')
            }}
          />
          <span
            aria-hidden="true"
            className={
              'travel-preferences__all-mark' +
              (allSelected || partiallySelected ? ' is-selected' : '')
            }
          >
            <Icon icon={partiallySelected ? Minus : Check} />
          </span>
          Select all lines
        </label>
      </div>
      {[...new Set(preferences.availableLines.map((line) => line.group))].map((group) => (
        <fieldset key={group} disabled={mutation.isLoading}>
          <legend>{group}</legend>
          <div className="travel-preferences__choices">
            {preferences.availableLines
              .filter((line) => line.group === group)
              .map((line) => (
                <label
                  key={line.id}
                  className={
                    'travel-preferences__choice' + (lines.includes(line.id) ? ' is-selected' : '')
                  }
                >
                  <input
                    type="checkbox"
                    checked={lines.includes(line.id)}
                    onChange={(event) => {
                      setLines((current) =>
                        event.target.checked
                          ? [...current, line.id]
                          : current.filter((id) => id !== line.id),
                      )
                      setFeedback('')
                    }}
                  />
                  <TravelLineSwatch lineId={line.id} />
                  <span>{line.name}</span>
                  <Icon icon={Check} />
                </label>
              ))}
          </div>
        </fieldset>
      ))}
      {conflict && (
        <div role="alert">
          <p className="note">Your travel choices changed elsewhere. Your draft is still here.</p>
          <button
            className="secondary"
            type="button"
            disabled={mutation.isLoading}
            onClick={() =>
              guard.close(() => {
                setBaseline(preferences)
                setLines(preferences.lines)
                mutation.reset()
                setFeedback('')
              })
            }
          >
            Discard draft and load saved travel choices
          </button>
        </div>
      )}
      {mutation.error && (
        <p className="error" role="alert">
          {shoppingError(mutation.error)?.message ?? 'Unable to save your choices.'}
        </p>
      )}
      <button
        type="submit"
        aria-busy={mutation.isLoading}
        disabled={!dirty || mutation.isLoading || conflict}
      >
        {mutation.isLoading
          ? 'Saving…'
          : !dirty && feedback
            ? 'Choices saved'
            : 'Save travel choices'}
      </button>
      <p className="note" role="status">
        {feedback}
      </p>
      <p className="note">
        Leave all lines unselected to switch TfL indicators off. London transport only. Guildford
        mainline trains are not covered. Live delays appear today; published planned works are
        checked for the next 30 days.
      </p>
    </form>
  )
}
