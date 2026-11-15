/** Conventional Western calendar ranges, not precise astronomical ingress times.
 * Source: https://production.royalmint.com/gifts/zodiac/a-guide-to-the-zodiac/
 */
export const zodiacSigns = [
  { id: 'aquarius', name: 'Aquarius', start: 120, range: '20 January–18 February' },
  { id: 'pisces', name: 'Pisces', start: 219, range: '19 February–20 March' },
  { id: 'aries', name: 'Aries', start: 321, range: '21 March–19 April' },
  { id: 'taurus', name: 'Taurus', start: 420, range: '20 April–20 May' },
  { id: 'gemini', name: 'Gemini', start: 521, range: '21 May–20 June' },
  { id: 'cancer', name: 'Cancer', start: 621, range: '21 June–22 July' },
  { id: 'leo', name: 'Leo', start: 723, range: '23 July–22 August' },
  { id: 'virgo', name: 'Virgo', start: 823, range: '23 August–22 September' },
  { id: 'libra', name: 'Libra', start: 923, range: '23 September–22 October' },
  { id: 'scorpio', name: 'Scorpio', start: 1023, range: '23 October–21 November' },
  { id: 'sagittarius', name: 'Sagittarius', start: 1122, range: '22 November–21 December' },
  { id: 'capricorn', name: 'Capricorn', start: 1222, range: '22 December–19 January' },
] as const

export type ZodiacSignId = (typeof zodiacSigns)[number]['id']

/** Read the card's local calendar date; never convert it through UTC or today's date. */
export function zodiacForDate(date: Date) {
  const monthDay = (date.getMonth() + 1) * 100 + date.getDate()
  for (let index = zodiacSigns.length - 1; index >= 0; index--) {
    if (monthDay >= zodiacSigns[index].start) return zodiacSigns[index]
  }
  return zodiacSigns[11]
}
