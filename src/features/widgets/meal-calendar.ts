const londonDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Widget business days follow the API's London calendar, wherever the viewer lives. */
export function mealToday(now: Date | number = Date.now()) {
  const parts = londonDate.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Work on date keys in UTC so DST never skips or repeats a calendar day. */
export function shiftMealDay(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatMealDate(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
    new Date(`${day}T12:00:00Z`),
  )
}

export function mealDateRange(now: Date | number) {
  const today = mealToday(now)
  return { min: shiftMealDay(today, -6), max: shiftMealDay(today, 365) }
}
