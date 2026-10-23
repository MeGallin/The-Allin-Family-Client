import type { WeatherWarningsFeed } from './types'

export function weatherWarningView(
  feed: WeatherWarningsFeed | undefined,
  isError: boolean,
  now: number,
) {
  const age = now - Date.parse(feed?.updatedAt ?? '')
  const recent = Number.isFinite(age) && age >= -120000 && age <= 15 * 60 * 1000
  return {
    warnings: recent
      ? (feed?.data ?? []).filter((warning) => Date.parse(warning.endsAt) > now)
      : [],
    // Allow one cache interval plus one client poll before calling a healthy feed delayed.
    stale: recent && (isError || feed?.status === 'stale' || age > 10 * 60 * 1000),
    unavailable: feed?.status !== 'unconfigured' && (!recent || feed?.status === 'unavailable'),
  }
}

export { formatUkDateTime as warningTime } from '../../lib/uk-time'
