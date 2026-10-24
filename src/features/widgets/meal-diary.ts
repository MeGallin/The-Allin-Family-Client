import { formatMealDate, mealToday, shiftMealDay } from './meal-calendar'
import type { DinnerPublication, FamilyWidget, MealType } from './types'
export const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'other', label: 'Other' },
]
export const mealLabel = (type: MealType) =>
  mealTypes.find((meal) => meal.value === type)?.label ?? 'Dinner'
export function mealDecision(publication: DinnerPublication) {
  const members = publication.members.filter((member) => member.active)
  const agreed = members.filter((member) => member.choice === 'agree').length
  const another = members.filter((member) => member.choice === 'another').length
  const replied = agreed + another
  return {
    agreed,
    another,
    replied,
    total: members.length,
    awaiting: members.length - replied,
    status: publication.eatenAt
      ? 'Recorded as eaten'
      : another
        ? 'Another suggestion requested'
        : replied === 0
          ? 'Chosen by default'
          : agreed === members.length
            ? 'Everyone’s happy'
            : 'Meal chosen',
  }
}
export type MealDiaryEntry = { widget: FamilyWidget; publication: DinnerPublication }
export const familyMeals = (widgets: FamilyWidget[]): MealDiaryEntry[] =>
  widgets
    .flatMap((widget) =>
      widget.publications
        .filter((publication) => publication.current)
        .map((publication) => ({ widget, publication })),
    )
    .sort(
      (a, b) =>
        a.publication.forDate.localeCompare(b.publication.forDate) ||
        mealTypes.findIndex((type) => type.value === a.publication.mealType) -
          mealTypes.findIndex((type) => type.value === b.publication.mealType) ||
        b.publication.publishedAt.localeCompare(a.publication.publishedAt),
    )
export const mealLink = ({ widget, publication }: MealDiaryEntry) =>
  '/my-space?view=' +
  (widget.visibility === 'private' ? 'widgets' : 'family') +
  '&widget=' +
  encodeURIComponent(widget.id) +
  '&meal=' +
  encodeURIComponent(publication.id)
export function diaryDays(entries: MealDiaryEntry[], now: number) {
  const today = mealToday(now)
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftMealDay(today, -index)
    return {
      date,
      label:
        index === 0
          ? 'Today'
          : formatMealDate(date, { weekday: 'short', day: 'numeric', month: 'short' }),
      meals: entries.filter((entry) => entry.publication.forDate === date),
    }
  })
}
export function mealMilestone(days: ReturnType<typeof diaryDays>) {
  const loggedDays = days.filter((day) =>
    day.meals.some((entry) => entry.publication.eatenAt),
  ).length
  return {
    loggedDays,
    goal: 3,
    progress: Math.min(loggedDays, 3),
    title:
      loggedDays === 7
        ? 'A full week on the table'
        : loggedDays >= 3
          ? 'Three-day goal reached'
          : loggedDays === 1
            ? 'Your first day, sorted'
            : loggedDays === 2
              ? 'One more day to your shared goal'
              : 'One less “what shall we eat?”',
    message:
      loggedDays >= 3
        ? 'Keep it easy. Every logged day is one less meal to remember.'
        : 'Log meals on three different days in the last seven. Each day counts once.',
  }
}
