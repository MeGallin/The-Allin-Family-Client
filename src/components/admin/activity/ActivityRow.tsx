import type { ActivityEntry } from '../../../features/activity/types'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { ActivityDetails } from './ActivityDetails'
const nouns: Record<string, string> = {
  shopping_item: 'shopping item',
  calendar_event: 'event',
  memory: 'memory',
  poll: 'poll',
  user_profile: 'profile',
  user_account: 'account',
  widget: 'widget',
  daily_word: 'personal Daily Word',
}
const verbs: Record<string, string> = {
  installed: 'installed',
  word_result_shared: 'shared a finished result from',
  word_result_withdrawn: 'withdrew a shared result from',
  new_game: 'started a new game on',
  restarted: 'restarted',
  completed: 'completed',
  created: 'added',
  edited: 'edited',
  removed: 'removed',
  checked: 'picked up',
  unchecked: 'unmarked',
  liked: 'liked',
  unliked: 'removed their like from',
  nickname_changed: 'changed the nickname on',
  week_preferences_changed: 'changed Week Ahead preferences on',
  travel_preferences_changed: 'changed travel preferences on',
  password_reset: 'reset the password for',
  password_changed: 'changed the password for',
  voted: 'voted on',
  vote_changed: 'changed their vote on',
  vote_withdrawn: 'withdrew their vote from',
  closed: 'closed voting on',
  reopened: 'reopened voting on',
  spun: 'spun',
  hidden: 'hid',
  shown: 'showed',
  meal_removed: 'removed a meal from',
  published: 'published a dinner suggestion from',
  meal_eaten: 'recorded an eaten meal from',
  meal_eaten_corrected: 'corrected an eaten meal record on',
  dinner_responded: 'responded to a dinner suggestion from',
  dinner_response_changed: 'changed their dinner response on',
  dinner_response_withdrawn: 'withdrew their dinner response on',
}
export function ActivityRow({ entry, day }: { entry: ActivityEntry; day?: string }) {
  const title = entry.after?.title ?? entry.before?.title ?? entry.targetName
  const choice = entry.after?.choice
  return (
    <li className="admin-activity__entry">
      {day && <h3 className="admin-activity__day">{day}</h3>}
      <p>
        <strong>{entry.actor.displayName}</strong>{' '}
        {verbs[entry.action] ?? entry.action.replaceAll('_', ' ')}{' '}
        {entry.entityType === 'widget' && (entry.after?.kind ?? entry.before?.kind) === 'sudoku'
          ? 'personal Sudoku'
          : (nouns[entry.entityType] ?? 'content')}
        {typeof title === 'string' && (
          <>
            : <strong>{title}</strong>
          </>
        )}
      </p>
      {typeof choice === 'string' && <p className="note">Choice: {choice}</p>}
      <p className="note">
        <FriendlyTime value={entry.occurredAt} />
      </p>
      <ActivityDetails entry={entry} />
    </li>
  )
}
