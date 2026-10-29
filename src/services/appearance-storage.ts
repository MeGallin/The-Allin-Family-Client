import { DEFAULT_ACCENT, isAccentId, type AccentId } from '../features/appearance/accent-options'
export const accentStorageKey = (ownerId: number) => `allin-family:accent:v1:user:${ownerId}`
// Anonymous visual hint for sign-in; never stores or discovers an account identity.
export const browserAccentStorageKey = 'allin-family:accent:v1:browser'
export function readBrowserAccent(): AccentId {
  try {
    const stored = localStorage.getItem(browserAccentStorageKey)
    return isAccentId(stored) ? stored : DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}
export function saveBrowserAccent(accent: AccentId): void {
  if (!isAccentId(accent)) return
  try {
    localStorage.setItem(browserAccentStorageKey, accent)
  } catch {
    // Remembering sign-in decoration is optional; keep the active visit usable.
  }
}
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
