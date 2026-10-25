import type { ActivityEntry } from './types'

export const widgetKinds: Record<string, string> = {
  'dinner-spinner': 'Dinner Spinner',
  sudoku: 'personal Sudoku',
  'daily-word': 'personal Daily Word',
  'focus-timer': 'personal Focus Timer',
}
export const widgetKindName = (value: unknown) =>
  typeof value === 'string' && Object.hasOwn(widgetKinds, value) ? widgetKinds[value] : undefined
export const widgetMetadataKeys = new Set([
  'kind',
  'ownerId',
  'visibility',
  'mealCount',
  'version',
  'spinId',
  'publicationId',
  'forDate',
  'mealType',
  'eaten',
  'response',
  'difficulty',
  'generation',
])
export const isWidgetActivity = (entry: ActivityEntry) =>
  ['widget', 'daily_word', 'focus_timer'].includes(entry.entityType)
export function widgetMetadataValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (key === 'kind') return widgetKindName(value) ? value : 'unidentified'
  if (key === 'visibility') return value === 'family' || value === 'private' ? value : 'unrecorded'
  if (key === 'response') return value === 'agree' || value === 'another' ? value : null
  if (key === 'eaten') return typeof value === 'boolean' ? value : null
  if (key === 'difficulty')
    return typeof value === 'string' && ['easy', 'medium', 'hard'].includes(value) ? value : null
  if (key === 'mealType')
    return typeof value === 'string' && ['breakfast', 'lunch', 'dinner', 'other'].includes(value)
      ? value
      : null
  if (key === 'forDate')
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
  return (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
    (typeof value === 'string' && /^\d{1,18}$/.test(value))
    ? value
    : null
}
export function widgetContext(entry: ActivityEntry) {
  if (!isWidgetActivity(entry)) return null
  const kind = entry.after?.kind ?? entry.before?.kind
  const known =
    entry.entityType === 'focus_timer'
      ? widgetKinds['focus-timer']
      : entry.entityType === 'daily_word'
        ? widgetKinds['daily-word']
        : widgetKindName(kind)
  const visibility = entry.after?.visibility ?? entry.before?.visibility
  return {
    tool: known ?? 'widget',
    missing: !known,
    reference: /^\d{1,18}$/.test(entry.entityId) ? entry.entityId : null,
    visibility: visibility === 'family' ? 'Family' : visibility === 'private' ? 'Personal' : null,
  }
}
