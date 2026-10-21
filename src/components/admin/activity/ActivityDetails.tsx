import { exactDate } from '../../../lib/friendly-dates'
import type { ActivityEntry } from '../../../features/activity/types'
const labels: Record<string, string> = {
  title: 'Title',
  detail: 'Details',
  checked: 'Picked up',
  liked: 'Liked',
  important: 'Important',
  startsAt: 'Starts',
  allDay: 'All day',
  annually: 'Repeats every year',
  timeZone: 'Time zone',
  nickname: 'Nickname',
  story: 'Story',
  photoKey: 'Photo',
  photoAlt: 'Photo description',
  closed: 'Voting closed',
  choices: 'Choices',
  choice: 'Vote',
}
function display(value: unknown, key: string): string {
  if (key === 'startsAt' && typeof value === 'string') return exactDate(value)
  if (key === 'photoKey') return value ? 'Photo attached' : 'No photo'
  if (value === null || value === undefined || value === '') return 'None'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
export function ActivityDetails({ entry }: { entry: ActivityEntry }) {
  const keys = Array.from(
    new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after ?? {})]),
  ).filter((key) => JSON.stringify(entry.before?.[key]) !== JSON.stringify(entry.after?.[key]))
  return keys.length ? (
    <details className="admin-activity__details">
      <summary>Change details</summary>
      <dl>
        {keys.map((key) => (
          <div key={key}>
            <dt>{labels[key] ?? key}</dt>
            <dd>
              <span>Before: </span>
              {display(entry.before?.[key], key)}
              <br />
              <span>After: </span>
              {display(entry.after?.[key], key)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  ) : null
}
