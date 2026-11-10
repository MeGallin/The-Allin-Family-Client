import { describe, expect, it } from 'vitest'
import { normalizeHex, parseAccent } from './accent-options'
import { contrastRatio, customAccentTokens, hexToHsv, hsvToHex } from './custom-accent'
import {
  accentStorageKey,
  readAccentPreference,
  saveAccentPreference,
} from '../../services/appearance-storage'

describe('custom accent boundary and palette', () => {
  it('accepts only supported versioned HEX and preserves legacy preset IDs', () => {
    expect(normalizeHex(' #ab34ef ')).toBe('#AB34EF')
    for (const value of ['red', '#abc', '#GGGGGG', '#123456; color:red', null, 123])
      expect(normalizeHex(value)).toBeNull()
    expect(parseAccent('pink')).toBe('pink')
    expect(parseAccent({ version: 3, kind: 'custom', hex: '#123456' })).toBeNull()
    expect(parseAccent({ version: 2, kind: 'custom', hex: '#123456', css: 'bad' })).toEqual({
      version: 2,
      kind: 'custom',
      hex: '#123456',
    })
    localStorage.clear()
    localStorage.setItem(accentStorageKey(101), 'orange')
    expect(readAccentPreference(101).accent).toBe('orange')
    expect(saveAccentPreference(101, { version: 2, kind: 'custom', hex: '#aabbcc' })).toBe(true)
    expect(readAccentPreference(101).accent).toEqual({ version: 2, kind: 'custom', hex: '#AABBCC' })
    expect(readAccentPreference(202).accent).toBe('cyan')
    localStorage.setItem(accentStorageKey(101), '{"version":2,"kind":"custom","hex":"url(bad)"}')
    expect(readAccentPreference(101).accent).toBe('cyan')
    localStorage.clear()
  })
  it('keeps text/actions/focus roles readable across extreme and sampled RGB inputs', () => {
    const samples = ['#FFFFFF', '#000000', '#808080', '#0000FF', '#FF0000', '#00FF00', '#345678']
    for (let r = 0; r <= 255; r += 51)
      for (let g = 0; g <= 255; g += 51)
        for (let b = 0; b <= 255; b += 51)
          samples.push('#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''))
    for (const hex of samples) {
      const tokens = customAccentTokens(hex)
      for (const role of ['--color-accent', '--color-accent-highlight']) {
        for (const background of ['#16263D', tokens['--color-accent-soft'], '#041925'])
          expect(
            contrastRatio(tokens[role], background),
            `${hex} ${role} on ${background}`,
          ).toBeGreaterThanOrEqual(4.5)
      }
      for (const text of ['#F4F9FF', '#B2C4DA'])
        expect(contrastRatio(text, tokens['--color-accent-soft'])).toBeGreaterThanOrEqual(4.5)
      expect(hsvToHex(hexToHsv(hex))).toBe(hex.toUpperCase())
    }
    expect(customAccentTokens('invalid')).toEqual({})
    expect(customAccentTokens('#22D3EE')['--color-accent']).toBe('#22D3EE')
    expect(hsvToHex({ h: 0, s: 100, v: 100 })).toBe('#FF0000')
    expect(hsvToHex({ h: 0, s: 0, v: 100 })).toBe('#FFFFFF')
    expect(hsvToHex({ h: 0, s: 100, v: 0 })).toBe('#000000')
  })
})
