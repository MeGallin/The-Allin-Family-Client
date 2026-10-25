export type ClockPreference = { analogue: boolean; hour12: boolean }
export const clockStorageKey = (ownerId: number) => `allin-family:clock:v1:user:${ownerId}`
const defaults: ClockPreference = { analogue: false, hour12: false }
const validOwner = (ownerId: number) => Number.isSafeInteger(ownerId) && ownerId > 0

export function readClockPreference(ownerId: number): ClockPreference {
  if (!validOwner(ownerId)) return defaults
  try {
    const value: unknown = JSON.parse(localStorage.getItem(clockStorageKey(ownerId)) ?? 'null')
    if (
      value &&
      typeof value === 'object' &&
      'analogue' in value &&
      'hour12' in value &&
      typeof value.analogue === 'boolean' &&
      typeof value.hour12 === 'boolean'
    )
      return { analogue: value.analogue, hour12: value.hour12 }
  } catch {
    /* Storage may be blocked or an old value malformed. */
  }
  return defaults
}
export function saveClockPreference(ownerId: number, value: ClockPreference): boolean {
  if (!validOwner(ownerId)) return false
  try {
    localStorage.setItem(
      clockStorageKey(ownerId),
      JSON.stringify({ analogue: value.analogue, hour12: value.hour12 }),
    )
    return true
  } catch {
    return false
  }
}
