export function dateInputValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function formatEventTime(value: string): string {
  return format(new Date(value), 'HH:mm', { locale: enGB })
}

export function formatEventDay(value: string): string {
  return format(new Date(value), 'EEEE, d MMM yyyy', { locale: enGB })
}

type CalendarDate = { startsAt: string; allDay?: boolean; annually?: boolean; occursAt?: string }
export function eventDate(event: CalendarDate): Date {
  const value = event.occursAt ?? event.startsAt
  return new Date(event.allDay ? value.slice(0, 10) + 'T00:00:00' : value)
}

// Project the next occurrence without changing the saved anchor or creating rows.
export function nextAnnualDate(event: CalendarDate, now = Date.now()): string {
  const [firstYear, month, day] = event.startsAt.slice(0, 10).split('-').map(Number)
  let year = Math.max(firstYear, new Date(now).getFullYear())
  const occurrence = (value: number) => {
    const lastDay = new Date(value, month, 0).getDate()
    return `${value}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}T00:00:00.000Z`
  }
  let value = occurrence(year)
  const end = eventDate({ startsAt: value, allDay: true })
  end.setDate(end.getDate() + 1)
  if (end.getTime() <= now) value = occurrence(++year)
  return value
}

export function isUpcomingEvent(event: CalendarDate, now = Date.now()): boolean {
  if (event.annually) return true
  const date = eventDate(event)
  if (event.allDay) date.setDate(date.getDate() + 1)
  return date.getTime() >= now
}

export function upcomingEvents<T extends CalendarDate>(events: T[], now = Date.now()): T[] {
  return events
    .map((event) => (event.annually ? { ...event, occursAt: nextAnnualDate(event, now) } : event))
    .filter((event) => isUpcomingEvent(event, now))
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())
}
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale/en-GB'
