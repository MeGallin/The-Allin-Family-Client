import {
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  formatDuration,
  intervalToDuration,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { enGB } from 'date-fns/locale/en-GB'
import { eventDate, nextAnnualDate } from './dates'
import type { FamilyEvent } from '../features/calendar/types'

// Count whole local calendar units, so time of day and DST do not remove a day.
export function calendarDuration(from: Date, to: Date): string {
  const first = startOfDay(from)
  const last = startOfDay(to)
  const duration = intervalToDuration(
    first <= last ? { start: first, end: last } : { start: last, end: first },
  )
  const units = (['years', 'months', 'days'] as const)
    .filter((unit) => duration[unit])
    .map((unit) => formatDuration(duration, { format: [unit], locale: enGB }))
  return units.length
    ? new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(units)
    : '0 days'
}

export function exactDate(value: string): string {
  const date = parseISO(value)
  return isValid(date) ? format(date, 'd MMM yyyy, HH:mm:ss', { locale: enGB }) : 'Date unavailable'
}

export function relativeDate(value: string, now = Date.now()): string {
  const date = parseISO(value)
  if (!isValid(date)) return 'Date unavailable'
  if (Math.abs(now - date.getTime()) < 60000) return 'just now'
  const days = differenceInCalendarDays(new Date(now), date)
  if (days === 1) return 'yesterday'
  if (days === -1) return 'tomorrow'
  if (days === 0)
    return formatDistanceStrict(date, new Date(now), {
      addSuffix: true,
      locale: enGB,
      roundingMethod: 'floor',
    })
  const duration = calendarDuration(date, new Date(now))
  return days > 0 ? `${duration} ago` : `in ${duration}`
}

export function eventCountdown(event: FamilyEvent, now = Date.now()): string {
  const date = eventDate(
    event.annually ? { ...event, occursAt: nextAnnualDate(event, now) } : event,
  )
  if (!isValid(date)) return 'Date unavailable'
  const days = differenceInCalendarDays(date, new Date(now))
  if (days === 0)
    return event.allDay ? 'Today' : date.getTime() >= now ? 'Later today' : 'Earlier today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  const duration = calendarDuration(new Date(now), date)
  return days > 0 ? `In ${duration}` : `${duration} ago`
}
