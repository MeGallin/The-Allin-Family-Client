import { formatMealDate } from '../../features/widgets/meal-calendar'
import { HorizontalScroll } from '../ui/HorizontalScroll'
import { Link } from 'react-router'
import { BookOpen, Check, ChevronDown } from 'lucide-react'
import {
  diaryDays,
  mealDecision,
  mealMilestone,
  mealLabel,
  mealLink,
  type MealDiaryEntry,
} from '../../features/widgets/meal-diary'
import { useNow } from '../../hooks/useNow'
import { Icon } from '../ui/Icon'
import './MealDiary.css'
export function MealDiary({
  entries,
  showMilestone = false,
  layout = 'list',
}: {
  entries: MealDiaryEntry[]
  showMilestone?: boolean
  layout?: 'list' | 'board'
}) {
  const days = diaryDays(entries, useNow())
  const milestone = mealMilestone(days)
  const meals = days.flatMap((day) => day.meals)
  const dayList = (
    <ol>
      {days.map((day) => (
        <li key={day.date} className={day.date === days[0].date ? 'is-today' : undefined}>
          <time dateTime={day.date}>
            {layout === 'board' ? (
              <>
                <span>
                  {formatMealDate(day.date, { weekday: 'short' })} ·{' '}
                  {formatMealDate(day.date, { month: 'short' })}
                </span>
                <b>{formatMealDate(day.date, { day: 'numeric' })}</b>
              </>
            ) : (
              day.label
            )}
          </time>
          {day.meals.length ? (
            <ul>
              {day.meals.map((entry) => (
                <li key={entry.publication.id}>
                  <Link to={mealLink(entry)}>
                    <span className="meal-diary__slot">
                      {mealLabel(entry.publication.mealType)}
                    </span>
                    <strong>{entry.publication.meal}</strong>
                    <span className="meal-diary__status">
                      {entry.publication.eatenAt && <Icon icon={Check} />}{' '}
                      {mealDecision(entry.publication).status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <span className="meal-diary__empty">No meal recorded</span>
          )}
        </li>
      ))}
    </ol>
  )
  return (
    <details
      className={'meal-diary' + (layout === 'board' ? ' meal-diary--board' : '')}
      open={layout === 'board'}
    >
      <summary>
        <Icon icon={BookOpen} />
        <span>
          Seven-day meal diary
          <small>
            {meals.filter((entry) => entry.publication.eatenAt).length} eaten · {meals.length}{' '}
            published {meals.length === 1 ? 'choice' : 'choices'}
          </small>
        </span>
        <Icon icon={ChevronDown} className="meal-diary__chevron" />
      </summary>
      <p className="note">
        Published choices stay in your diary. Mark a meal as eaten once you’ve had it.
      </p>
      {showMilestone && (
        <div className="meal-diary__milestone" role="group" aria-label="Shared meal milestone">
          <strong>{milestone.title}</strong>
          <span>{milestone.loggedDays} of 7 days logged · Shared goal: 3 days</span>
          <progress
            max={milestone.goal}
            value={milestone.progress}
            aria-label="Days towards the three-day shared meal goal"
          />
          <p>{milestone.message}</p>
        </div>
      )}
      {layout === 'board' ? (
        <HorizontalScroll label="Meal diary days">{dayList}</HorizontalScroll>
      ) : (
        dayList
      )}
    </details>
  )
}
