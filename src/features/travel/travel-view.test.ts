import { describe, expect, it } from 'vitest'
import { prepareTravelView } from './travel-view'
import type { TravelNotice, TravelSnapshot } from './types'

function travelDayView(
  snapshot: TravelSnapshot | undefined,
  error: boolean,
  at: number,
  day: string,
) {
  return prepareTravelView(snapshot, error, at)(day)
}

const now = Date.parse('2026-10-23T12:00:00Z')
const live: TravelNotice = {
  id: 'live',
  lineId: 'central',
  line: 'Central',
  status: 'Minor Delays',
  severity: 9,
  description: 'Delays',
  advice: '',
  planned: false,
  startsAt: null,
  endsAt: null,
}
const planned: TravelNotice = {
  ...live,
  id: 'planned',
  planned: true,
  description: 'Engineering work',
  startsAt: '2026-10-24T23:00:00Z',
  endsAt: '2026-10-25T00:00:00Z',
}
function feed(): TravelSnapshot {
  return {
    lines: ['central'],
    through: '2026-11-22',
    live: { status: 'ready', updatedAt: new Date(now).toISOString(), data: [live] },
    planned: { status: 'ready', updatedAt: new Date(now).toISOString(), data: [planned] },
  }
}
describe('travel calendar projection', () => {
  it('shows live incidents today only, including undated notices', () => {
    expect(travelDayView(feed(), false, now, '2026-10-23').notices.map((n) => n.id)).toEqual([
      'live',
    ])
    expect(travelDayView(feed(), false, now, '2026-10-26').notices).toEqual([])
  })
  it('uses UK dates and exclusive ends across the BST change', () => {
    expect(travelDayView(feed(), false, now, '2026-10-24').notices).toEqual([])
    expect(travelDayView(feed(), false, now, '2026-10-25').notices.map((n) => n.id)).toEqual([
      'planned',
    ])
    const changed = feed()
    changed.planned.data = [
      { ...planned, startsAt: '2026-10-24T10:00:00Z', endsAt: '2026-10-24T23:00:00Z' },
    ]
    expect(travelDayView(changed, false, now, '2026-10-25').notices).toEqual([])
  })
  it('expires live data promptly and keeps planned data independently', () => {
    expect(travelDayView(feed(), false, now + 91000, '2026-10-23').notices).toEqual([])
    expect(travelDayView(feed(), false, now + 91000, '2026-10-25').notices).toHaveLength(1)
    expect(travelDayView(feed(), true, now, '2026-10-23').stale).toBe(true)
  })
  it('disabled and failed feeds never report an all-clear', () => {
    const disabled = feed()
    disabled.lines = []
    expect(travelDayView(disabled, false, now, '2026-10-23').configured).toBe(false)
    expect(travelDayView(undefined, true, now, '2026-10-23').notices).toEqual([])
    const failed = feed()
    failed.live = { status: 'unavailable', data: null, updatedAt: null }
    expect(travelDayView(failed, false, now, '2026-10-23').unavailable).toBe(true)
  })
  it('removes expired intervals and combines duplicate current/planned reports', () => {
    const value = feed()
    value.planned.data = [
      { ...live, planned: true, startsAt: '2026-10-23T10:00:00Z', endsAt: '2026-10-23T15:00:00Z' },
    ]
    expect(travelDayView(value, false, now, '2026-10-23').notices).toHaveLength(1)
    value.live.data = [{ ...live, endsAt: new Date(now).toISOString() }]
    value.planned.data = []
    expect(travelDayView(value, false, now, '2026-10-23').notices).toEqual([])
  })
})
