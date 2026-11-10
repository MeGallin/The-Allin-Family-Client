export const ACCENT_CHOICES = [
  { id: 'cyan', label: 'Turquoise' },
  { id: 'orange', label: 'Orange' },
  { id: 'gold', label: 'Gold' },
  { id: 'purple', label: 'Purple' },
  { id: 'pink', label: 'Pink' },
  { id: 'green', label: 'Green' },
] as const
export type AccentId = (typeof ACCENT_CHOICES)[number]['id']
export const DEFAULT_ACCENT: AccentId = 'cyan'
export const isAccentId = (value: unknown): value is AccentId =>
  ACCENT_CHOICES.some((choice) => choice.id === value)

// Custom values are data, never selectors or CSS fragments.
export type CustomAccent = { version: 2; kind: 'custom'; hex: string }
export type AccentPreference = AccentId | CustomAccent
export function normalizeHex(value: unknown): string | null {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim())
    ? value.trim().toUpperCase()
    : null
}
export function parseAccent(value: unknown): AccentPreference | null {
  if (isAccentId(value)) return value
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<CustomAccent>
  const hex = normalizeHex(candidate.hex)
  return candidate.version === 2 && candidate.kind === 'custom' && hex
    ? { version: 2, kind: 'custom', hex }
    : null
}
export const accentKey = (accent: AccentPreference) =>
  typeof accent === 'string' ? accent : accent.hex
