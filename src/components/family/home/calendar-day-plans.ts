import { addDays, startOfDay } from 'date-fns'
import type { FamilyEvent } from '../../../features/calendar/types'
import { eventDate, upcomingEvents } from '../../../lib/dates'

/** Calendar-day membership is distinct from the next future appointment. */
export function calendarDayPlans(events: FamilyEvent[], now: number, dayCount: number) {
  const start = startOfDay(now)
  const end = addDays(start, dayCount)
  return upcomingEvents(events, start.getTime()).filter((event) => {
    const date = eventDate(event)
    return date >= start && date < end
  })
}
