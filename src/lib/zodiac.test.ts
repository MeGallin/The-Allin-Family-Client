import { expect, it } from 'vitest'
import { zodiacForDate } from './zodiac'

// Independent expected boundaries, including the December/January wrap.
const boundaries = [
  [1, 20, 'aquarius', 'capricorn'],
  [2, 19, 'pisces', 'aquarius'],
  [3, 21, 'aries', 'pisces'],
  [4, 20, 'taurus', 'aries'],
  [5, 21, 'gemini', 'taurus'],
  [6, 21, 'cancer', 'gemini'],
  [7, 23, 'leo', 'cancer'],
  [8, 23, 'virgo', 'leo'],
  [9, 23, 'libra', 'virgo'],
  [10, 23, 'scorpio', 'libra'],
  [11, 22, 'sagittarius', 'scorpio'],
  [12, 22, 'capricorn', 'sagittarius'],
] as const

it.each(boundaries)(
  'changes sign at %i/%i on the local card date',
  (month, day, sign, previous) => {
    expect(zodiacForDate(new Date(2026, month - 1, day)).id).toBe(sign)
    expect(zodiacForDate(new Date(2026, month - 1, day - 1, 23, 59)).id).toBe(previous)
  },
)

it('keeps Capricorn across years and Pisces on leap day', () => {
  for (const date of [new Date(2026, 11, 31), new Date(2027, 0, 1), new Date(2027, 0, 19)]) {
    expect(zodiacForDate(date).id).toBe('capricorn')
  }
  expect(zodiacForDate(new Date(2028, 1, 29)).id).toBe('pisces')
})

it('reads calendar parts without serialising through UTC', () => {
  // Throw on UTC conversion: the result must depend on the local calendar parts only.
  const date = new Date(2026, 10, 22, 0, 5)
  date.toISOString = () => {
    throw new Error('UTC conversion is not a calendar date')
  }
  expect(zodiacForDate(date).id).toBe('sagittarius')
})
