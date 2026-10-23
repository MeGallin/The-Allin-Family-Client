import { useId, useState, type FormEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { weekContextApi } from '../../services/week-context-query'
import { shoppingError } from '../../services/shopping-query'
import type { TownChoice, WeekPreferences } from '../../features/week-context/types'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { Icon } from '../ui/Icon'
import { LoadingState } from '../ui/LoadingState'
import './WeekPreferencesForm.css'
import { useWeekContext } from '../../features/week-context/useWeekContext'
import { WeekContextStatus } from './WeekContextStatus'

export function WeekPreferencesForm() {
  const query = weekContextApi.useGetWeekPreferencesQuery()
  const context = useWeekContext()
  return (
    <>
      <p className="note">
        Choose your weather town and bank holiday region. These choices follow your account on every
        device.
      </p>
      {query.isLoading ? (
        <LoadingState label="Loading your preferences…" />
      ) : query.data ? (
        <PreferenceEditor preferences={query.data} />
      ) : (
        <p className="error" role="alert">
          {shoppingError(query.error)?.message ?? 'Unable to load your preferences.'}
        </p>
      )}
      {query.isError && (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            void query.refetch()
          }}
        >
          Reload preferences
        </button>
      )}
      <div className="week-preferences__source">
        <WeekContextStatus
          data={context.data}
          loading={context.isLoading}
          error={context.isError}
          retry={() => {
            void context.refetch()
          }}
        />
      </div>
    </>
  )
}

function PreferenceEditor({ preferences }: { preferences: WeekPreferences }) {
  const id = useId()
  const [baseline, setBaseline] = useState(preferences)
  const [region, setRegion] = useState(preferences.region)
  // undefined keeps the saved town; null deliberately turns the forecast off.
  const [selection, setSelection] = useState<TownChoice | null | undefined>()
  const [term, setTerm] = useState('')
  const [feedback, setFeedback] = useState('')
  const [search, results] = weekContextApi.useLazySearchWeekTownsQuery()
  const [save, mutation] = weekContextApi.useSaveWeekPreferencesMutation()
  const town = selection === undefined ? baseline.town : selection
  const dirty = selection !== undefined || region !== baseline.region || term !== ''
  const guard = useDraftGuard(dirty, mutation.isLoading)
  const changedElsewhere = preferences.version > baseline.version
  const choices = results.originalArgs === term.trim() ? results.currentData?.towns : undefined
  const searchError =
    results.originalArgs === term.trim() ? shoppingError(results.error)?.message : undefined
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isLoading || changedElsewhere || term.trim()) return
    setFeedback('')
    try {
      const saved = await save({
        version: baseline.version,
        region,
        ...(selection !== undefined ? { townToken: selection?.token ?? null } : {}),
      }).unwrap()
      guard.complete(() => {
        setBaseline(saved)
        setRegion(saved.region)
        setSelection(undefined)
        setTerm('')
      })
      setFeedback('Saved. Week Ahead will use your choices.')
    } catch {
      /* Preserve the town selection and region for correction or retry. */
    }
  }
  return (
    <form className="week-preferences" onSubmit={submit}>
      <fieldset className="preference-group" disabled={mutation.isLoading}>
        <legend>Weather forecast</legend>
        <div className="week-preferences__current">
          <Icon icon={MapPin} />
          <span>
            <small>Your weather town</small>
            <strong>{town?.label ?? 'Weather switched off'}</strong>
          </span>
        </div>
        <label htmlFor={id + '-town'}>Find a town</label>
        <div className="week-preferences__search">
          <input
            id={id + '-town'}
            type="search"
            autoComplete="off"
            value={term}
            maxLength={80}
            placeholder="Town, country"
            disabled={mutation.isLoading}
            aria-describedby={id + '-help'}
            onChange={(event) => {
              setTerm(event.target.value)
              setFeedback('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                if (term.trim().length >= 2 && !results.isFetching) void search(term.trim())
              }
            }}
          />
          <button
            type="button"
            className="secondary"
            disabled={term.trim().length < 2 || results.isFetching || mutation.isLoading}
            onClick={() => {
              void search(term.trim())
            }}
          >
            <Icon icon={Search} />
            {results.isFetching ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="note" id={id + '-help'}>
          Search and select the correct town. Only the town name is sent to Open-Meteo; no GPS or
          street address is needed.
        </p>
        {searchError && (
          <p className="error" role="alert">
            {searchError}
          </p>
        )}
        {choices &&
          !results.isFetching &&
          (choices.length ? (
            <fieldset className="week-preferences__results">
              <legend>Choose your town</legend>
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="secondary"
                  disabled={mutation.isLoading}
                  onClick={() => {
                    setSelection(choice)
                    setTerm('')
                    setFeedback('')
                  }}
                >
                  <Icon icon={MapPin} />
                  <span>{choice.label}</span>
                </button>
              ))}
            </fieldset>
          ) : (
            <p role="status" className="note">
              No towns found. Try a nearby town or add the country.
            </p>
          ))}
        <div className="week-preferences__actions">
          <button
            className="text-button"
            type="button"
            disabled={mutation.isLoading || !town}
            onClick={() => {
              setSelection(null)
              setTerm('')
              setFeedback('')
            }}
          >
            Turn weather off
          </button>
        </div>
      </fieldset>
      <fieldset className="preference-group" disabled={mutation.isLoading}>
        <legend>Bank holidays</legend>
        <label htmlFor={id + '-region'}>Bank holiday region</label>
        <select
          id={id + '-region'}
          value={region}
          disabled={mutation.isLoading}
          onChange={(event) => {
            setRegion(event.target.value)
            setFeedback('')
          }}
        >
          <option value="england-and-wales">England and Wales</option>
          <option value="scotland">Scotland</option>
          <option value="northern-ireland">Northern Ireland</option>
          <option value="">Don’t show UK bank holidays</option>
        </select>
        <p className="note">The dates shown on your calendar follow this region.</p>
      </fieldset>
      {changedElsewhere && (
        <div className="week-preferences__conflict" role="alert">
          <p>Your preferences changed elsewhere. Your draft is still here.</p>
          <button
            type="button"
            className="secondary"
            disabled={mutation.isLoading}
            onClick={() =>
              guard.close(() => {
                setBaseline(preferences)
                setRegion(preferences.region)
                setSelection(undefined)
                setTerm('')
                mutation.reset()
              })
            }
          >
            Discard draft and load saved choices
          </button>
        </div>
      )}
      {mutation.error && (
        <p className="error" role="alert">
          {shoppingError(mutation.error)?.message ?? 'Unable to save your choices.'}
        </p>
      )}
      <button type="submit" disabled={mutation.isLoading || changedElsewhere || !!term.trim()}>
        {mutation.isLoading ? 'Saving…' : 'Save Week Ahead preferences'}
      </button>
      {!!term.trim() && (
        <p className="note">Select a search result or clear your search before saving.</p>
      )}
      <p role="status" className="week-preferences__feedback">
        {feedback}
      </p>
      <p className="note week-preferences__attribution">
        Town search by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo
        </a>
        , using{' '}
        <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">
          GeoNames
        </a>
        .
      </p>
    </form>
  )
}
