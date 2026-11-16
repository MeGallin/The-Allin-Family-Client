export type AccentPalette = { surface: string; raised: string; actionInk: string }

function opaqueHex(input: string): string {
  const value = input.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toUpperCase()
  if (/^#[0-9a-f]{3}$/i.test(value))
    return (
      '#' +
      value
        .slice(1)
        .split('')
        .map((channel) => channel + channel)
        .join('')
        .toUpperCase()
    )
  const match = /^rgba?\(([^)]+)\)$/i.exec(value)
  if (match) {
    const parts = match[1].trim().split(/[\s,/]+/)
    const channels = parts
      .slice(0, 3)
      .map((part) => Number.parseFloat(part) * (part.endsWith('%') ? 2.55 : 1))
    const numeric = parts.every((part) => /^(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(part))
    const opaque =
      parts.length === 3 ||
      (parts.length === 4 && Number.parseFloat(parts[3]) === (parts[3].endsWith('%') ? 100 : 1))
    if (
      numeric &&
      opaque &&
      channels.length === 3 &&
      channels.every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 255)
    )
      return (
        '#' +
        channels
          .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()
      )
  }
  throw new Error('Accent contrast palette requires opaque HEX or RGB CSS colours.')
}

/** One DOM sampling boundary; base CSS tokens own the contrast palette. */
export function readAccentPalette(root = document.documentElement): AccentPalette {
  const style = getComputedStyle(root)
  return {
    surface: opaqueHex(style.getPropertyValue('--color-surface')),
    raised: opaqueHex(style.getPropertyValue('--color-surface-raised')),
    // Read an immutable base role, never the inline custom-accent output.
    actionInk: opaqueHex(style.getPropertyValue('--color-action-ink')),
  }
}
