import { useNow } from '../../hooks/useNow'
import { exactDate, relativeDate } from '../../lib/friendly-dates'

export function FriendlyTime({ value, showExact = false }: { value: string; showExact?: boolean }) {
  const now = useNow()
  const relative = relativeDate(value, now)
  const exact = exactDate(value)
  return (
    <time
      dateTime={value}
      title={exact}
      aria-label={showExact ? undefined : `${relative}, ${exact}`}
    >
      {relative}
      {showExact && <> · {exact}</>}
    </time>
  )
}
