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
