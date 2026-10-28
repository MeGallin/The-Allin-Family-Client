import { formatMealDate, mealToday, shiftMealDay } from '../../../features/widgets/meal-calendar'
import { ArrowUpRight, Check, ChevronDown, Utensils } from 'lucide-react'
import { Link } from 'react-router'
import { useWidgets } from '../../../features/widgets/useWidgets'
import {
  diaryDays,
  familyMeals,
  mealDecision,
  mealLabel,
  mealLink,
} from '../../../features/widgets/meal-diary'
import { useNow } from '../../../hooks/useNow'
import { Icon } from '../../ui/Icon'
import { WidgetAppIcon } from '../../widgets/WidgetStoreArt'
import { MealDiary } from '../../widgets/MealDiary'
import { HomeDataError } from './HomeDataError'
import './HomeDinnerSummary.css'

/** Dashboard reads published choices only; replies and diary updates stay at their source. */
export function HomeDinnerSummary() {
  const { widgets, loading, error, refresh, ownerId, removals } = useWidgets()
  const now = useNow()
  const today = mealToday(now)
  const tomorrow = shiftMealDay(today, 1)
  const entries = familyMeals(
    widgets.filter(
      (widget) => widget.visibility === 'family' && !widget.hidden && !removals[widget.id],
    ),
  )
  const upcoming = entries.filter((entry) => entry.publication.forDate >= today)
  const dinners = upcoming.slice(0, 4)
  const days = diaryDays(entries, now)
  const diaryMeals = days.flatMap((day) => day.meals)
  const eaten = diaryMeals.filter((entry) => entry.publication.eatenAt).length
  return (
    <section className="home-meal-card" aria-labelledby="home-meal-title" aria-busy={loading}>
      <HomeDataError error={error} retry={refresh} />
      <div className="home-meal-card__heading">
        <WidgetAppIcon id="dinner" compact />
        <div className="home-index-row__label">
          <h3 id="home-meal-title">Seven-day meal diary</h3>
          <small>Shared meals, kept in one place</small>
        </div>
        <div className="home-meal-card__summary">
          {loading || error ? (
            <strong>{loading ? 'Loading family meals…' : 'Meal summary unavailable'}</strong>
          ) : (
            <p className="home-meal-card__totals">
              <span>
                <small>Eaten</small>
                <strong>{eaten}</strong>
              </span>
              <span>
                <small>Published {diaryMeals.length === 1 ? 'choice' : 'choices'}</small>
                <strong>{diaryMeals.length}</strong>
              </span>
            </p>
          )}
          {!loading && !error && (
            <p className="home-meal-card__next">
              <small>Next meal</small>
              <strong>{dinners[0]?.publication.meal ?? 'No upcoming published meals'}</strong>
            </p>
          )}
        </div>
      </div>
      {!loading && !error && (
        <ol className="home-meal-week" aria-label="Published meals in the last seven days">
          {[...days].reverse().map((day) => {
            const logged = day.meals.some((entry) => entry.publication.eatenAt)
            const published = day.meals.length > 0
            const status = logged ? 'Eaten' : published ? 'Published' : 'No meal'
            return (
              <li key={day.date} className={published ? 'home-meal-week__published' : undefined}>
                <time dateTime={day.date}>
                  {formatMealDate(day.date, { weekday: 'short' })}
                  <span>{formatMealDate(day.date, { day: 'numeric', month: 'short' })}</span>
                </time>
                <span className="home-meal-week__mark" aria-hidden="true">
                  {logged ? <Icon icon={Check} /> : published ? '•' : '—'}
                </span>
                <small className="sr-only">{status}</small>
              </li>
            )
          })}
        </ol>
      )}
      {!loading && !error && (
        <p className="home-meal-week__legend" aria-hidden="true">
          Last seven days · ✓ Eaten · • Published · — No meal
        </p>
      )}
      <details className="home-meal-index">
        <summary>
          <span>View meals and all seven days</span>
          <Icon icon={ChevronDown} />
        </summary>
        <div className="home-dinners">
          {dinners.map((entry) => {
            const { widget, publication } = entry
            const { agreed, another, replied, total, awaiting, status } = mealDecision(publication)
            const mine = publication.members.find((member) => member.id === ownerId)?.choice
            const when =
              publication.forDate === today
                ? 'Today'
                : publication.forDate === tomorrow
                  ? 'Tomorrow'
                  : formatMealDate(publication.forDate, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
            return (
              <Link key={publication.id} to={mealLink(entry)} className="home-dinner">
                <span className="home-dinner__icon">
                  <Icon icon={Utensils} />
                </span>
                <span className="home-dinner__content">
                  <span className="home-dinner__label">
                    {when} · {mealLabel(publication.mealType)}
                  </span>
                  <strong>{publication.meal}</strong>
                  <span className="home-dinner__meta">
                    {status} · Published by {publication.publisher.name}
                  </span>
                  <span className="home-dinner__responses">
                    {publication.eatenAt
                      ? 'Meal logged in the seven-day diary'
                      : replied === 0
                        ? 'Replies optional · This is the current choice'
                        : `${agreed} of ${total} happy`}
                    {another > 0 && ` · ${another} suggest another`}
                    {replied > 0 && awaiting > 0 && ` · ${awaiting} not replied`}
                  </span>
                </span>
                <span className="home-dinner__action">
                  <Icon icon={ArrowUpRight} />
                  <span>
                    {publication.eatenAt
                      ? 'View diary'
                      : mine == null
                        ? 'View & respond'
                        : 'View choice'}
                  </span>
                </span>
              </Link>
            )
          })}
          {upcoming.length > 4 && (
            <Link to="/my-space?view=family" className="note">
              View all {upcoming.length} published meal choices
            </Link>
          )}
          {entries.length > 0 ? (
            <MealDiary entries={entries} showMilestone />
          ) : (
            <p className="note">
              {loading
                ? 'Loading family meals…'
                : error
                  ? 'Open family widgets to check published meals.'
                  : 'No family meals have been published yet.'}
            </p>
          )}
          <Link to="/my-space?view=family" className="home-meal-index__source">
            Open family widgets <Icon icon={ArrowUpRight} />
          </Link>
        </div>
      </details>
    </section>
  )
}
