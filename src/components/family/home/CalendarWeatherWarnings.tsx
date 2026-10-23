import { lazy } from 'react'
import { TriangleAlert } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { WeatherWarning } from '../../../features/weather-warnings/types'
import type { CalendarIndicator } from '../../ui/IndicatorStrip'

const WeatherWarnings = lazy(() => import('../weather/WeatherWarnings'))

export type CalendarWeatherWarningsProps = {
  day: string
  warnings: WeatherWarning[]
  location: string
  updatedAt: string | null
  stale: boolean
}

export function weatherCalendarIndicator(
  props: CalendarWeatherWarningsProps,
): CalendarIndicator | null {
  const first = props.warnings[0]
  if (!first) return null
  const description =
    props.warnings.map((warning) => warning.level + ' warning of ' + warning.weather).join('; ') +
    (props.stale ? ' · updates delayed' : '')
  return {
    id: 'weather',
    label:
      props.warnings.length > 1
        ? props.warnings.length + ' warnings'
        : first.weather.charAt(0).toUpperCase() + first.weather.slice(1),
    accessibleLabel:
      props.warnings.length +
      ' Met Office weather ' +
      (props.warnings.length === 1 ? 'warning' : 'warnings') +
      ' for ' +
      props.day +
      ': ' +
      description,
    description,
    source: 'Met Office',
    icon: TriangleAlert,
    tone: first.level,
    priority: Math.min(
      ...props.warnings.map((warning) => ({ red: 0, amber: 1, yellow: 2 })[warning.level]),
    ),
    dialogTitle: 'Weather warnings · ' + format(parseISO(props.day), 'd MMM'),
    details: () => <WeatherWarnings {...props} />,
  }
}
