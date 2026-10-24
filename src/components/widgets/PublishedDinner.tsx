import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useNow } from '../../hooks/useNow'
import { familyMeals, mealDecision, mealLabel } from '../../features/widgets/meal-diary'
import { Check, Clock3, RotateCw, Users, Utensils } from 'lucide-react'
import { formatMealDate, mealToday } from '../../features/widgets/meal-calendar'
import { useWidgets } from '../../features/widgets/useWidgets'
import type { DinnerMember, DinnerPublication, FamilyWidget } from '../../features/widgets/types'
import { ContentSurface } from '../ui/ContentSurface'
import { Icon } from '../ui/Icon'
import { FriendlyTime } from '../ui/FriendlyTime'
import './PublishedDinner.css'

function Responses({ members }: { members: DinnerMember[] }) {
  return (
    <ul className="published-dinner__people">
      {members.map((member) => (
        <li key={member.id}>
          <span className="published-dinner__avatar" aria-hidden="true">
            {Array.from(member.name)[0]}
          </span>
          <strong>{member.name}</strong>
          <span
            className={
              'published-dinner__response' + (member.choice === 'agree' ? ' is-agreed' : '')
            }
          >
            <Icon
              icon={
                member.choice === 'agree' ? Check : member.choice === 'another' ? RotateCw : Clock3
              }
            />
            {member.choice === 'agree'
              ? 'Happy with that'
              : member.choice === 'another'
                ? 'Suggest another'
                : member.active
                  ? 'Not replied'
                  : 'Account inactive'}
          </span>
        </li>
      ))}
    </ul>
  )
}
function PublicationHeading({ publication }: { publication: DinnerPublication }) {
  return (
    <>
      <h3>{publication.meal}</h3>
      <p className="published-dinner__byline">
        Suggested by {publication.publisher.name} · <FriendlyTime value={publication.publishedAt} />
      </p>
      <p className="note">
        {mealLabel(publication.mealType)} ·{' '}
        {formatMealDate(publication.forDate, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
    </>
  )
}
function PublishedMeal({
  widget,
  disabled,
  publication,
}: {
  widget: FamilyWidget
  disabled: boolean
  publication?: DinnerPublication
}) {
  const { ownerId, pending, offline, respond, recordEaten } = useWidgets()
  const today = mealToday(useNow())
  const latest = publication
  if (!latest)
    return widget.visibility === 'family' ? (
      <ContentSurface className="published-dinner">
        <header>
          <Icon icon={Users} />
          <p className="eyebrow">Family suggestion</p>
        </header>
        <h2>Nothing published yet.</h2>
        <p className="note">
          Try the wheel as often as you like. Publish your chosen meal when you’re ready for the
          family to respond.
        </p>
      </ContentSurface>
    ) : null
  const { agreed, another, replied, total, awaiting, status } = mealDecision(latest)
  const mine = latest.members.find((member) => member.id === ownerId)?.choice ?? null
  const busy = pending || offline || disabled || widget.visibility !== 'family'
  const history = widget.publications.filter(
    (item) => !item.current && item.forDate === latest.forDate && item.mealType === latest.mealType,
  )
  return (
    <ContentSurface className="published-dinner">
      <header>
        <Icon icon={Users} />
        <p className="eyebrow">At the family table</p>
        <span className="published-dinner__status">{status}</span>
      </header>
      <div className="published-dinner__headline">
        <PublicationHeading publication={latest} />
      </div>
      <div className="published-dinner__summary">
        <strong>
          {latest.eatenAt
            ? 'Meal completed'
            : replied === 0
              ? 'Published choice stands'
              : `${agreed} of ${total} happy`}
        </strong>
        <span>
          {latest.eatenAt ? (
            'Replies kept with this meal'
          ) : replied === 0 ? (
            'No replies yet · Replies are optional'
          ) : (
            <>
              {another ? `${another} suggest another · ` : ''}
              {awaiting} not replied
            </>
          )}
        </span>
      </div>
      {replied > 0 && (
        <progress
          max={Math.max(total, 1)}
          value={agreed}
          aria-label={`${agreed} of ${total} active family members happy with this suggestion`}
        />
      )}
      <details className="published-dinner__members">
        <summary>
          <span className="published-dinner__avatars" aria-hidden="true">
            {latest.members.slice(0, 4).map((member) => (
              <span key={member.id}>{Array.from(member.name)[0]}</span>
            ))}
          </span>
          Family responses ({replied}/{total})
        </summary>
        <Responses members={latest.members} />
      </details>
      {widget.visibility === 'family' ? (
        <div className="published-dinner__reply" aria-busy={pending}>
          <p className="eyebrow">{pending ? 'Saving…' : 'Your response'}</p>
          <div className="actions">
            <button
              type="button"
              className={mine === 'agree' ? '' : 'secondary'}
              aria-pressed={mine === 'agree'}
              disabled={busy || !!latest.eatenAt}
              onClick={() => void respond(widget, latest, 'agree')}
            >
              <Icon icon={Check} />
              Happy with that
            </button>
            <button
              type="button"
              className="secondary"
              aria-pressed={mine === 'another'}
              disabled={busy || !!latest.eatenAt}
              onClick={() => void respond(widget, latest, 'another')}
            >
              <Icon icon={RotateCw} />
              Suggest another
            </button>
            {mine && (
              <button
                type="button"
                className="text-button"
                disabled={busy || !!latest.eatenAt}
                onClick={() => void respond(widget, latest, null)}
              >
                Clear my response
              </button>
            )}
          </div>
          <p className="note">
            {latest.eatenAt
              ? 'This meal is recorded as eaten. Correct the eaten record to change responses.'
              : 'Replies are optional. The published choice stands unless the family changes it.'}
          </p>
        </div>
      ) : (
        <p className="note">
          This installation is now personal. Previous family suggestions are kept here, but no new
          replies can be added.
        </p>
      )}
      {widget.visibility === 'family' && latest.forDate <= today && (
        <div className="published-dinner__eaten">
          <p className="note">
            {latest.eatenAt ? (
              <>
                Recorded by {latest.eatenBy?.name} · <FriendlyTime value={latest.eatenAt} />
              </>
            ) : (
              'Had this meal? Add it to your eaten total in the seven-day diary.'
            )}
          </p>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void recordEaten(widget, latest, !latest.eatenAt)}
          >
            <Icon icon={latest.eatenAt ? RotateCw : Utensils} />
            {latest.eatenAt ? 'Correct eaten record' : 'Mark as eaten'}
          </button>
        </div>
      )}
      {history.length > 0 && (
        <details className="published-dinner__history">
          <summary>Previous suggestions ({history.length} recent)</summary>
          {history.map((publication) => (
            <article key={publication.id}>
              <PublicationHeading publication={publication} />
              <Responses members={publication.members} />
              <p className="note">Replaced · replies kept with this suggestion</p>
            </article>
          ))}
        </details>
      )}
    </ContentSurface>
  )
}

export function PublishedDinner({ widget, disabled }: { widget: FamilyWidget; disabled: boolean }) {
  const [search, setSearch] = useSearchParams()
  const today = mealToday(useNow())
  const entries = familyMeals([widget])
  const current = entries.map((entry) => entry.publication)
  const selected =
    current.find((item) => item.id === search.get('meal')) ??
    current.find(
      (item) => item.forDate === search.get('mealDate') && item.mealType === search.get('mealType'),
    ) ??
    current.find((item) => item.forDate >= today) ??
    current.at(-1)
  const group = useRef<HTMLDivElement>(null)
  const requestedDate = search.get('mealDate')
  const requestedType = search.get('mealType')
  const requested = search.get('meal')
  useEffect(() => {
    // A dashboard/diary link targets a meal; ordinary visits still lead with the wheel.
    if (requested || (requestedDate && requestedType))
      group.current?.scrollIntoView?.({ block: 'start' })
  }, [requested, requestedDate, requestedType, widget.id])
  const unavailable = !!requested && !current.some((item) => item.id === requested)
  function showCurrent() {
    setSearch((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('meal')
      next.delete('mealDate')
      next.delete('mealType')
      return next
    })
  }
  return (
    <div className="published-dinner-group" ref={group}>
      {current.length > 1 && (
        <div className="published-dinner__picker">
          <label htmlFor={'published-meal-' + widget.id}>Published meal</label>
          <select
            id={'published-meal-' + widget.id}
            value={selected?.id ?? ''}
            onChange={(event) =>
              setSearch((previous) => {
                const next = new URLSearchParams(previous)
                next.set('meal', event.target.value)
                next.delete('mealDate')
                next.delete('mealType')
                return next
              })
            }
          >
            {current.map((item) => (
              <option key={item.id} value={item.id}>
                {formatMealDate(item.forDate, { day: 'numeric', month: 'short' })} ·{' '}
                {mealLabel(item.mealType)} · {item.meal}
              </option>
            ))}
          </select>
        </div>
      )}
      {unavailable ? (
        <ContentSurface>
          <h2>This meal choice has changed</h2>
          <p className="note">
            It may have been replaced or moved out of the recent diary. Review the current choice
            before responding.
          </p>
          <button type="button" className="secondary" onClick={showCurrent}>
            Show current meal
          </button>
        </ContentSurface>
      ) : (
        <PublishedMeal
          key={selected?.id ?? 'empty'}
          widget={widget}
          disabled={disabled}
          publication={selected}
        />
      )}
    </div>
  )
}
