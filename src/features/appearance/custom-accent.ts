import { normalizeHex } from './accent-options'

const rgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
const toHex = (channels: number[]) =>
  '#' +
  channels
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
const mix = (hex: string, target: string, amount: number) =>
  toHex(rgb(hex).map((value, index) => value + (rgb(target)[index] - value) * amount))

export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) =>
    rgb(hex).reduce((sum, value, index) => {
      const channel = value / 255
      return (
        sum +
        (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][index]
      )
    }, 0)
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (values[1] + 0.05) / (values[0] + 0.05)
}

/** Keep the chosen HEX intact; lift only theme roles that need contrast on navy. */
export function customAccentTokens(input: string): Record<string, string> {
  const hex = normalizeHex(input)
  if (!hex) return {}
  const soft = mix(hex, '#101C30', 0.88)
  let accent = hex
  // Raised is Nimbus's lightest base surface; soft can be slightly lighter for white inputs.
  // Small sRGB steps are deterministic and retain the original hue direction.
  for (let step = 0; step <= 100; step++) {
    accent = mix(hex, '#FFFFFF', step / 100)
    if ([soft, '#16263D', '#041925'].every((surface) => contrastRatio(accent, surface) >= 4.5))
      break
  }
  return {
    '--color-accent': accent,
    '--color-accent-highlight': mix(accent, '#FFFFFF', 0.22),
    '--color-accent-soft': soft,
    '--color-text-on-action': '#041925',
  }
}

export type Hsv = { h: number; s: number; v: number }
export function hexToHsv(hex: string): Hsv {
  const [r, g, b] = rgb(hex).map((value) => value / 255)
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min
  let hue = 0
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
  }
  return { h: (hue * 60 + 360) % 360, s: max ? (delta / max) * 100 : 0, v: max * 100 }
}
export function hsvToHex({ h, s, v }: Hsv): string {
  const c = ((v / 100) * s) / 100,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = v / 100 - c
  const channels =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return toHex(channels.map((value) => (value + m) * 255))
}
