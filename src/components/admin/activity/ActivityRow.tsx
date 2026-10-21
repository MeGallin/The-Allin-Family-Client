import type { ActivityEntry } from '../../../features/activity/types'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { exactDate } from '../../../lib/friendly-dates'
import { ActivityDetails } from './ActivityDetails'
const nouns: Record<string, string> = {
  shopping_item: 'shopping item',
  calendar_event: 'event',
  memory: 'memory',
  poll: 'poll',
  user_profile: 'profile',
}
const verbs: Record<string, string> = {
  created: 'added',
  edited: 'edited',
  removed: 'removed',
  checked: 'picked up',
  unchecked: 'unmarked',
  liked: 'liked',
  unliked: 'removed their like from',
  nickname_changed: 'changed the nickname on',
  voted: 'voted on',
  vote_changed: 'changed their vote on',
  vote_withdrawn: 'withdrew their vote from',
  closed: 'closed voting on',
  reopened: 'reopened voting on',
}
export function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const title = entry.after?.title ?? entry.before?.title ?? entry.targetName
  const choice = entry.after?.choice
  return (
    <li className="admin-activity__entry">
      <p>
        <strong>{entry.actor.displayName}</strong>{' '}
        {verbs[entry.action] ?? entry.action.replaceAll('_', ' ')}{' '}
        {nouns[entry.entityType] ?? 'content'}
        {typeof title === 'string' && (
          <>
            : <strong>{title}</strong>
          </>
        )}
      </p>
      {typeof choice === 'string' && <p className="note">Choice: {choice}</p>}
      <p className="note">
        <FriendlyTime value={entry.occurredAt} /> · {exactDate(entry.occurredAt)}
      </p>
      <ActivityDetails entry={entry} />
    </li>
  )
}
