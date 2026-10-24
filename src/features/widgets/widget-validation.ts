import type { WidgetDraft } from './types'
export { mealDateRange } from './meal-calendar'
export function widgetText(value: string) {
  return value
    .replace(/[\u200b\u2060\ufeff\u00ad]/gu, '')
    .replace(/[\p{Z}\s]+/gu, ' ')
    .trim()
}
const forbidden = /[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069]/u
function textError(value: string, max: number, label: string) {
  if (forbidden.test(value)) return `${label}: use one line without control characters.`
  const clean = widgetText(value)
  if (!/[^\p{Z}\p{C}\p{M}]/u.test(clean)) return `${label}: enter a visible name.`
  if (Array.from(clean).length > max) return `${label}: keep it to ${max} characters.`
  return ''
}
const mealComparer = new Intl.Collator('en', { usage: 'search', sensitivity: 'base' })
export function validateWidget(draft: WidgetDraft) {
  const title = textError(draft.title, 120, 'Widget name')
  if (title) return { message: title, field: 'title' }
  if (draft.meals.length < 2 || draft.meals.length > 12)
    return { message: 'Keep between 2 and 12 meal choices.', field: 'meals' }
  const names = new Set<string>()
  for (const [index, meal] of draft.meals.entries()) {
    const message = textError(meal.title, 80, `Meal ${index + 1}`)
    if (message) return { message, field: `meal-${index}` }
    const key = widgetText(meal.title).toLowerCase()
    if ([...names].some((name) => mealComparer.compare(name, key) === 0))
      return {
        message: `Meal ${index + 1} repeats another choice. Give each meal a different name.`,
        field: `meal-${index}`,
      }
    names.add(key)
  }
  return null
}
