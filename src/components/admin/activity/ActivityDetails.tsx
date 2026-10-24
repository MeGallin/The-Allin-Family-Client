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
  town: 'Weather town',
  holidayRegion: 'Bank holiday region',
  travelLines: 'TfL lines',
  username: 'Sign-in username',
  displayName: 'Full name',
  role: 'Role',
  enabled: 'Account access enabled',
  mustChangePassword: 'Password change required',
  story: 'Story',
  photoKey: 'Photo',
  photoAlt: 'Photo description',
  closed: 'Voting closed',
  closesAt: 'Voting closes',
  choices: 'Choices',
  choice: 'Vote',
  kind: 'Widget type',
  difficulty: 'Starting level',
  ownerId: 'Widget owner ID',
  visibility: 'Visibility',
  mealCount: 'Meal choices',
  version: 'Revision',
  spinId: 'Saved pick ID',
  publicationId: 'Published suggestion ID',
  forDate: 'Meal date',
  mealType: 'Meal slot',
  eaten: 'Recorded as eaten',
  response: 'Dinner response',
}
function display(value: unknown, key: string): string {
  if (key === 'response' && value === 'agree') return 'Happy with that'
  if (key === 'response' && value === 'another') return 'Suggest another'
  if (key === 'travelLines' && Array.isArray(value) && !value.length) return 'Switched off'
  if (key === 'holidayRegion' && typeof value === 'string')
    return (
      (
        {
          'england-and-wales': 'England and Wales',
          scotland: 'Scotland',
          'northern-ireland': 'Northern Ireland',
        } as Record<string, string>
      )[value] ?? 'Switched off'
    )
  if ((key === 'startsAt' || key === 'closesAt') && typeof value === 'string')
    return exactDate(value)
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
  return (
    <details className="admin-activity__details">
      <summary>Change details</summary>
      <dl>
        <div>
          <dt>Recorded</dt>
          <dd>
            <time dateTime={entry.occurredAt}>{exactDate(entry.occurredAt)}</time>
          </dd>
        </div>
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
  )
}
