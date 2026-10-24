import { formatMealDate, mealToday, shiftMealDay } from '../../../features/widgets/meal-calendar'
import { ArrowUpRight, Utensils } from 'lucide-react'
import { Link } from 'react-router'
import { useWidgets } from '../../../features/widgets/useWidgets'
import {
  familyMeals,
  mealDecision,
  mealLabel,
  mealLink,
} from '../../../features/widgets/meal-diary'
import { useNow } from '../../../hooks/useNow'
import { Icon } from '../../ui/Icon'
import { MealDiary } from '../../widgets/MealDiary'
import { HomeDataError } from './HomeDataError'
import './HomeDinnerSummary.css'

/** Dashboard reads published choices only; replies and diary updates stay at their source. */
export function HomeDinnerSummary() {
  const { widgets, loading, error, refresh, ownerId, removals } = useWidgets()
  const today = mealToday(useNow())
  const tomorrow = shiftMealDay(today, 1)
  const entries = familyMeals(
    widgets.filter(
      (widget) => widget.visibility === 'family' && !widget.hidden && !removals[widget.id],
    ),
  )
  const upcoming = entries.filter((entry) => entry.publication.forDate >= today)
  const dinners = upcoming.slice(0, 4)
  if (!entries.length && !error) return null
  return (
    <div className="home-dinners" aria-label="Published family meals" aria-busy={loading}>
      <HomeDataError error={error} retry={refresh} />
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
      {entries.length > 0 && <MealDiary entries={entries} showMilestone />}
    </div>
  )
}
