import { describe, expect, it } from 'vitest'
import type { FamilyEvent } from '../../../features/calendar/types'
import { upcomingEvents } from '../../../lib/dates'
import { calendarDayPlans } from './calendar-day-plans'

const local = (day: number, hour = 0) => new Date(2026, 9, day, hour).toISOString()
function event(id: string, startsAt: string, allDay = false, annually = false): FamilyEvent {
  const actor = { id: Number(id), displayName: 'Synthetic ' + id }
  return {
    id,
    title: 'Same shared plan',
    startsAt,
    allDay,
    annually,
    timeZone: 'Europe/London',
    detail: '',
    version: 1,
    createdBy: actor,
    updatedBy: actor,
    createdAt: '',
    updatedAt: '',
  }
}
describe('Home calendar-day membership', () => {
  it('keeps every today plan from different creators after its start, excludes yesterday and retains future-only next', () => {
    const now = new Date(2026, 9, 25, 13).getTime()
    const items = [
      event('1', local(25, 8)),
      event('2', local(25, 8)),
      event('3', local(25, 10)),
      event('4', local(25, 12)),
      event('5', local(25, 18)),
      event('6', local(24, 23)),
      event('7', '2026-10-24T00:00:00Z', true),
      event('8', local(26, 9)),
    ]
    const shown = calendarDayPlans(items, now, 7)
    expect(shown.map((e) => e.id)).toEqual(['1', '2', '3', '4', '5', '8'])
    expect(new Set(shown.slice(0, 5).map((e) => e.createdBy.id)).size).toBe(5)
    expect(upcomingEvents(items, now).map((e) => e.id)).toEqual(['5', '8'])
    expect(calendarDayPlans(items, new Date(2026, 9, 26).getTime(), 1).map((e) => e.id)).toEqual([
      '8',
    ])
  })
  it('projects annual occurrences, keeps all-day today and uses inclusive start/exclusive range end', () => {
    const now = new Date(2026, 9, 25, 13).getTime()
    const items = [
      event('1', '2025-10-25T00:00:00Z', true, true),
      event('2', '2026-10-25T00:00:00Z', true),
      event('3', local(31, 23)),
      event('4', new Date(2026, 10, 1).toISOString()),
    ]
    const shown = calendarDayPlans(items, now, 7)
    expect(shown.map((e) => e.id)).toEqual(['1', '2', '3'])
    expect(shown[0].occursAt).toBe('2026-10-25T00:00:00.000Z')
    expect(items[0].startsAt).toBe('2025-10-25T00:00:00Z')
  })
  const londonAutumn =
    new Date('2026-10-25T00:30:00Z').getTimezoneOffset() === -60 &&
    new Date('2026-10-25T02:30:00Z').getTimezoneOffset() === 0
  it.runIf(londonAutumn)(
    'retains both repeated London hours throughout the 25-hour autumn day',
    () => {
      const items = [
        event('1', '2026-10-24T22:59:00Z'),
        event('2', '2026-10-24T23:30:00Z'),
        event('3', '2026-10-25T00:30:00Z'),
        event('4', '2026-10-25T01:30:00Z'),
        event('5', '2026-10-25T23:59:00Z'),
        event('6', '2026-10-26T00:00:00Z'),
      ]
      for (const now of ['2026-10-25T00:45:00Z', '2026-10-25T13:00:00Z', '2026-10-25T23:59:59Z'])
        expect(calendarDayPlans(items, Date.parse(now), 1).map((e) => e.id)).toEqual([
          '2',
          '3',
          '4',
          '5',
        ])
      expect(
        calendarDayPlans(items, Date.parse('2026-10-26T00:00:00Z'), 1).map((e) => e.id),
      ).toEqual(['6'])
    },
  )
})
