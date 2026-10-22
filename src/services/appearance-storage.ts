import { DEFAULT_ACCENT, isAccentId, type AccentId } from '../features/appearance/accent-options'
export const accentStorageKey = (ownerId: number) => `allin-family:accent:v1:user:${ownerId}`
const validOwner = (ownerId: number) => Number.isSafeInteger(ownerId) && ownerId > 0
/** Only a palette ID is stored. No account details, content or CSS values. */
export function readAccentPreference(ownerId: number): { accent: AccentId; persisted: boolean } {
  if (!validOwner(ownerId)) return { accent: DEFAULT_ACCENT, persisted: false }
  try {
    const stored = localStorage.getItem(accentStorageKey(ownerId))
    return { accent: isAccentId(stored) ? stored : DEFAULT_ACCENT, persisted: true }
  } catch {
    return { accent: DEFAULT_ACCENT, persisted: false }
  }
}
export function saveAccentPreference(ownerId: number, accent: AccentId): boolean {
  if (!validOwner(ownerId) || !isAccentId(accent)) return false
  try {
    if (accent === DEFAULT_ACCENT) localStorage.removeItem(accentStorageKey(ownerId))
    else localStorage.setItem(accentStorageKey(ownerId), accent)
    return true
  } catch {
    return false
  }
}
