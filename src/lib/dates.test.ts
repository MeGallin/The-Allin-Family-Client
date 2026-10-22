import { describe, expect, it } from 'vitest'
import { validDateInput } from './dates'

describe('calendar route date validation', () => {
  it('preserves valid local dates and leap days', () => {
    expect(validDateInput('2027-10-16')).toBe('2027-10-16')
    expect(validDateInput('2028-02-29')).toBe('2028-02-29')
  })
  it('rejects rollover, malformed and missing dates', () => {
    for (const value of [
      '2027-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-1-1',
      '2026-10-22T00:00:00Z',
      '',
      null,
      undefined,
    ])
      expect(validDateInput(value)).toBeUndefined()
  })
})
