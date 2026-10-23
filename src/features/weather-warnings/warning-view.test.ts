import { describe, expect, it } from 'vitest'
import { weatherWarningView, warningTime } from './warning-view'
import type { WeatherWarningsFeed } from './types'

const now = Date.parse('2026-10-23T12:00:00Z')
const feed: WeatherWarningsFeed = {
  status: 'ready',
  updatedAt: new Date(now).toISOString(),
  location: 'Guildford',
  data: [
    {
      id: '1',
      title: 'Wind',
      description: 'Source notice',
      level: 'yellow',
      weather: 'wind',
      region: 'SE',
      areas: ['Surrey'],
      matchedAreas: ['Surrey'],
      url: 'https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings',
      startsAt: '2026-10-23T09:00:00Z',
      endsAt: '2026-10-23T20:00:00Z',
      startsOn: '2026-10-23',
      endsOn: '2026-10-23',
    },
  ],
}
describe('weather warnings', () => {
  it('filters exact expiry and bounds stale notices', () => {
    expect(weatherWarningView(feed, false, now).warnings).toHaveLength(1)
    expect(weatherWarningView(feed, true, now).stale).toBe(true)
    expect(weatherWarningView(feed, false, now + 16 * 60000).warnings).toHaveLength(0)
    expect(weatherWarningView(feed, false, now + 16 * 60000).unavailable).toBe(true)
    const expired = {
      ...feed,
      data: feed.data!.map((w) => ({ ...w, endsAt: new Date(now).toISOString() })),
    }
    expect(weatherWarningView(expired, false, now).warnings).toHaveLength(0)
  })
  it('distinguishes switched-off from unavailable and allows a normal poll interval', () => {
    expect(
      weatherWarningView(
        { ...feed, status: 'unconfigured', updatedAt: null, data: null },
        false,
        now,
      ).unavailable,
    ).toBe(false)
    expect(weatherWarningView(feed, false, now + 6 * 60000).stale).toBe(false)
    expect(weatherWarningView(feed, false, now + 11 * 60000).stale).toBe(true)
  })
  it('shows UK summer and winter time explicitly', () => {
    expect(warningTime('2026-10-23T09:00:00Z')).toContain('10:00 BST')
    expect(warningTime('2026-11-23T09:00:00Z')).toContain('09:00 GMT')
  })
})
