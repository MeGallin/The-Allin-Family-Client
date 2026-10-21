import type { FamilyEvent } from '../../../features/calendar/types'
import { useNow } from '../../../hooks/useNow'
import { eventCountdown } from '../../../lib/friendly-dates'
import './EventCountdown.css'
export function EventCountdown({ event }: { event: FamilyEvent }) {
  return <span className="event-countdown">{eventCountdown(event, useNow())}</span>
}
