import { lazy } from 'react'
import { TrainFront } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { CalendarIndicator } from '../../ui/IndicatorStrip'
import type { TravelDayView } from '../../../features/travel/types'

const TravelDetails = lazy(() => import('../travel/TravelDetails'))
export type CalendarTravelProps = TravelDayView & { day: string }

export function travelCalendarIndicator(
  props: CalendarTravelProps,
  today: boolean,
): CalendarIndicator | null {
  if (!props.configured || (!props.notices.length && !(today && props.unavailable))) return null
  const count = new Set(props.notices.map((notice) => notice.lineId)).size
  const description = props.notices.length
    ? `${count} affected ${count === 1 ? 'line' : 'lines'}${props.stale ? ' · updates delayed' : ''}${props.unavailable ? ' · some updates unavailable' : ''}`
    : 'TfL updates unavailable'
  return {
    id: 'travel',
    label: count ? 'TfL ' + count : 'TfL ?',
    compactLabel: count ? String(count) : '?',
    accessibleLabel: `Transport for London for ${props.day}: ${description}`,
    description,
    source: 'Transport for London',
    icon: TrainFront,
    tone:
      props.unavailable || props.notices.some((n) => [1, 2, 3, 4, 6, 16, 20].includes(n.severity))
        ? 'amber'
        : 'accent',
    priority: 5,
    dialogTitle: 'Transport for London · ' + format(parseISO(props.day), 'd MMM'),
    details: () => <TravelDetails {...props} />,
  }
}
