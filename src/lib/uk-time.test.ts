import { expect, it, vi } from 'vitest'
import { formatUkDateTime, formatUkTime } from './uk-time'

it('normalises browser GMT+0 spelling in full and time-only UK timestamps', () => {
  const parts = vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
    { type: 'hour', value: '01' },
    { type: 'literal', value: ':' },
    { type: 'minute', value: '29' },
    { type: 'literal', value: ' ' },
    { type: 'timeZoneName', value: 'GMT+0' },
  ])
  try {
    expect(formatUkTime('2026-10-26T01:29:00Z')).toBe('01:29 GMT')
    expect(formatUkDateTime('2026-10-26T01:29:00Z')).toBe('01:29 GMT')
  } finally {
    parts.mockRestore()
  }
})
