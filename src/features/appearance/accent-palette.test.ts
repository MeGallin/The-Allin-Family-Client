import { afterEach, expect, it } from 'vitest'
import { readAccentPalette } from './accent-palette'

afterEach(() => document.documentElement.removeAttribute('style'))

it('samples changed CSS palette roles and ignores generated action text overrides', () => {
  const root = document.documentElement
  root.style.setProperty('--color-surface', '#123456')
  root.style.setProperty('--color-surface-raised', 'rgb(20, 40, 60)')
  root.style.setProperty('--color-action-ink', 'rgba(4 25 37 / 1)')
  root.style.setProperty('--color-text-on-action', '#FF0000')
  expect(readAccentPalette()).toEqual({
    surface: '#123456',
    raised: '#14283C',
    actionInk: '#041925',
  })
  root.style.setProperty('--color-surface', '#abc')
  expect(readAccentPalette().surface).toBe('#AABBCC')
})

it('rejects missing/translucent palette roles instead of silently assuming old base colours', () => {
  expect(() => readAccentPalette()).toThrow(/opaque/)
  document.documentElement.style.setProperty('--color-surface', 'rgba(20, 40, 60, 0.5)')
  expect(() => readAccentPalette()).toThrow(/opaque/)
})
