import { describe, expect, it } from 'vitest'
import type { FamilyEvent } from './types'
import { calendarEventPath, calendarGroups, selectedCalendarEvent } from './calendar-selection'
const actor = { id: 1, displayName: 'Synthetic' }
const event = (id: string, startsAt: string, allDay = false, annually = false): FamilyEvent => ({
  id,
  title: 'Same title',
  startsAt,
  allDay,
  annually,
  timeZone: 'Europe/London',
  detail: '',
  version: 1,
  createdAt: '',
  updatedAt: '',
  createdBy: actor,
  updatedBy: actor,
})
describe('calendar reference and occurrence policy', () => {
  const london =
    new Date('2026-10-25T00:30:00Z').getTimezoneOffset() === -60 &&
    new Date('2026-10-25T02:30:00Z').getTimezoneOffset() === 0
  it.runIf(london)('groups both repeated London hours into the whole 25-hour Today', () => {
    const items = [
      event('1', '2026-10-24T22:59:00Z'),
      event('2', '2026-10-24T23:30:00Z'),
      event('3', '2026-10-25T00:30:00Z'),
      event('4', '2026-10-25T01:30:00Z'),
      event('5', '2026-10-26T00:00:00Z'),
    ]
    const groups = calendarGroups(items, Date.parse('2026-10-25T23:59:00Z'))
    expect(groups.today.map((e) => e.id)).toEqual(['2', '3', '4'])
    expect(groups.past.map((e) => e.id)).toEqual(['1'])
    expect(groups.future.map((e) => e.id)).toEqual(['5'])
  })
  it('preserves duplicate identities and distinguishes Today from prior/future dates', () => {
    const now = new Date(2026, 9, 25, 13).getTime(),
      items = [
        event('1', new Date(2026, 9, 25, 8).toISOString()),
        event('2', new Date(2026, 9, 25, 8).toISOString()),
        event('3', new Date(2026, 9, 24, 8).toISOString()),
        event('4', new Date(2026, 9, 26, 8).toISOString()),
      ]
    const groups = calendarGroups(items, now)
    expect(groups.today.map((e) => e.id)).toEqual(['1', '2'])
    expect(groups.past.map((e) => e.id)).toEqual(['3'])
    expect(groups.future.map((e) => e.id)).toEqual(['4'])
    expect(calendarEventPath(items[1])).toBe('/calendar?event=2&occurrence=2026-10-25')
  })
  it('validates leap annual occurrences and reports moved timed targets without inventing a new record', () => {
    const annual = event('1', '2024-02-29T00:00:00Z', true, true)
    expect(selectedCalendarEvent([annual], '1', '2027-02-28').event?.occursAt).toBe(
      '2027-02-28T00:00:00.000Z',
    )
    expect(selectedCalendarEvent([annual], '1', '2027-03-01').event).toBeNull()
    const saved = event('2', new Date(2026, 9, 26, 9).toISOString())
    expect(selectedCalendarEvent([saved], '2', '2026-10-25').event).toBe(saved)
    expect(selectedCalendarEvent([saved], '2', '2026-10-25').reason).toContain('date has changed')
  })
})
