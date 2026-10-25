import { startOfDay, addDays } from 'date-fns'
import { dateInputValue, eventDate, nextAnnualDate, validDateInput } from '../../lib/dates'
import type { FamilyEvent } from './types'

export function calendarEventPath(
  event: Pick<FamilyEvent, 'id' | 'startsAt' | 'allDay' | 'occursAt'>,
  day = dateInputValue(eventDate(event)),
) {
  return '/calendar?' + new URLSearchParams({ event: event.id, occurrence: day }).toString()
}

export function calendarGroups(events: FamilyEvent[], now: number) {
  const today = startOfDay(now),
    tomorrow = addDays(today, 1)
  const projected = events.map((event) =>
    event.annually ? { ...event, occursAt: nextAnnualDate(event, now) } : event,
  )
  return {
    today: projected.filter((event) => eventDate(event) >= today && eventDate(event) < tomorrow),
    future: projected.filter((event) => eventDate(event) >= tomorrow),
    past: projected.filter((event) => eventDate(event) < today),
  }
}

export function selectedCalendarEvent(
  events: FamilyEvent[],
  id: string | null,
  occurrence: string | null,
) {
  if (!id || !/^\d{1,18}$/.test(id) || !validDateInput(occurrence))
    return { event: null, reason: 'This event link is not valid.' }
  const saved = events.find((event) => event.id === id)
  if (!saved)
    return { event: null, reason: 'This event is no longer available. It may have been removed.' }
  if (saved.annually) {
    const projected = {
      ...saved,
      occursAt: nextAnnualDate(saved, new Date(occurrence + 'T00:00:00').getTime()),
    }
    if (dateInputValue(eventDate(projected)) !== occurrence)
      return {
        event: null,
        reason:
          'That occurrence is no longer available. Open the calendar to find the current date.',
      }
    return { event: projected, reason: '' }
  }
  return {
    event: saved,
    reason:
      dateInputValue(eventDate(saved)) === occurrence
        ? ''
        : 'This event’s date has changed. Its current saved details are shown.',
  }
}
