import { describe, expect, it } from 'vitest'
import { mealDateRange, validateWidget, widgetText } from './widget-validation'
import type { WidgetDraft } from './types'
const draft = (meals = ['Soup', 'Pasta']): WidgetDraft => ({
  title: 'Family meals',
  visibility: 'family',
  meals: meals.map((title) => ({ title })),
})
describe('Widget input boundaries', () => {
  it.each([
    '',
    ' ',
    '\u200b\u2060',
    '\u200d\ufe0f',
    '\u0301',
    '\u00a0',
    'meal\nname',
    'meal\u202ename',
    'x'.repeat(121),
  ])('rejects invisible or invalid titles: %j', (title) =>
    expect(validateWidget({ ...draft(), title })).not.toBeNull(),
  )
  it('normalizes spaces and invisible separators consistently', () => {
    expect(widgetText('  Fish\u00a0  and\u200b chips  ')).toBe('Fish and chips')
    expect(validateWidget(draft(['Curry', 'Cur\u200bry']))?.field).toBe('meal-1')
    expect(validateWidget(draft(['Äpfel', 'äpfel']))?.field).toBe('meal-1')
    expect(validateWidget(draft(['Café', 'Cafe\u0301']))?.field).toBe('meal-1')
  })
  it('accepts names with emoji and text markup without treating them as code', () => {
    expect(validateWidget(draft(['🍜 Noodles', '<img src=x onerror=alert(1)>']))).toBeNull()
    expect(validateWidget(draft(['😀'.repeat(80), 'Soup']))).toBeNull()
    expect(validateWidget(draft(['😀'.repeat(81), 'Soup']))?.field).toBe('meal-0')
  })
  it('enforces two to twelve different meals and precise feedback', () => {
    expect(validateWidget(draft(['Soup']))?.field).toBe('meals')
    expect(validateWidget(draft(Array.from({ length: 13 }, (_, i) => 'Meal ' + i)))?.field).toBe(
      'meals',
    )
    expect(validateWidget(draft(['Soup', '  SOUP ']))?.field).toBe('meal-1')
    expect(validateWidget(draft(['Soup', '\u200b']))?.message).toContain('Meal 2')
  })
  it('uses a practical date window without changing the seven-day calendar interval', () => {
    expect(mealDateRange(new Date(2026, 9, 24, 12))).toEqual({
      min: '2026-10-18',
      max: '2027-10-24',
    })
  })
})
