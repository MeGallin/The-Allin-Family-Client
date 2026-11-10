import {
  DEFAULT_ACCENT,
  parseAccent,
  type AccentPreference,
} from '../features/appearance/accent-options'
export const accentStorageKey = (ownerId: number) => `allin-family:accent:v1:user:${ownerId}`
// Anonymous visual hint for sign-in; never stores or discovers an account identity.
export const browserAccentStorageKey = 'allin-family:accent:v1:browser'
function decodeAccent(stored: string | null): AccentPreference {
  if (!stored) return DEFAULT_ACCENT
  try {
    return parseAccent(JSON.parse(stored)) ?? DEFAULT_ACCENT
  } catch {
    return parseAccent(stored) ?? DEFAULT_ACCENT
  }
}
const encodeAccent = (accent: AccentPreference) =>
  typeof accent === 'string' ? accent : JSON.stringify(accent)
export function readBrowserAccent(): AccentPreference {
  try {
    const stored = localStorage.getItem(browserAccentStorageKey)
    return decodeAccent(stored)
  } catch {
    return DEFAULT_ACCENT
  }
}
export function saveBrowserAccent(accent: AccentPreference): void {
  const validated = parseAccent(accent)
  if (!validated) return
  try {
    localStorage.setItem(browserAccentStorageKey, encodeAccent(validated))
  } catch {
    // Remembering sign-in decoration is optional; keep the active visit usable.
  }
}
const validOwner = (ownerId: number) => Number.isSafeInteger(ownerId) && ownerId > 0
/** Legacy preset IDs and versioned validated custom HEX only; no account details or CSS. */
export function readAccentPreference(ownerId: number): {
  accent: AccentPreference
  persisted: boolean
} {
  if (!validOwner(ownerId)) return { accent: DEFAULT_ACCENT, persisted: false }
  try {
    const stored = localStorage.getItem(accentStorageKey(ownerId))
    return { accent: decodeAccent(stored), persisted: true }
  } catch {
    return { accent: DEFAULT_ACCENT, persisted: false }
  }
}
export function saveAccentPreference(ownerId: number, accent: AccentPreference): boolean {
  const validated = parseAccent(accent)
  if (!validOwner(ownerId) || !validated) return false
  try {
    if (validated === DEFAULT_ACCENT) localStorage.removeItem(accentStorageKey(ownerId))
    else localStorage.setItem(accentStorageKey(ownerId), encodeAccent(validated))
    return true
  } catch {
    return false
  }
}
