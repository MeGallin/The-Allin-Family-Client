import { useNow } from '../../../hooks/useNow'
import { formatPollDeadline, pollTimeLeft } from '../../../features/polls/poll-deadline'
/** Uses the shared clock, so dashboard summaries add no independent timer or request. */
export function PollTimeRemaining({ value }: { value: string }) {
  const now = useNow()
  const exact = formatPollDeadline(value)
  return (
    <time
      dateTime={value}
      title={exact}
      aria-label={`${pollTimeLeft(value, now, 'long')}. Scheduled cutoff ${exact}`}
    >
      {pollTimeLeft(value, now)}
    </time>
  )
}
