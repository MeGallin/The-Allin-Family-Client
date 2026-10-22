import { useAppDispatch } from '../../app/store-hooks'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useEffect } from 'react'
import { pollsApi } from '../../services/polls-query'
import { usePolls } from './usePolls'
export function PollsSync({ onSessionExpired }: { onSessionExpired: () => void }) {
  const dispatch = useAppDispatch()
  const { polls, pending, failure } = usePolls()
  pollsApi.useGetPollsQuery(undefined, useLiveQueryOptions('/polls', pending))
  // One boundary timer for the subscribed collection, never one timer per card.
  useEffect(() => {
    const next = Math.min(
      ...polls.filter((poll) => !poll.closed).map((poll) => Date.parse(poll.closesAt)),
    )
    if (!Number.isFinite(next)) return
    const timer = window.setTimeout(
      () => {
        dispatch(
          pollsApi.util.updateQueryData('getPolls', undefined, (draft) => {
            for (const poll of draft.polls)
              if (Date.parse(poll.closesAt) <= Date.now()) poll.closed = true
          }),
        )
      },
      Math.min(Math.max(0, next - Date.now()), 2_147_483_647),
    )
    return () => window.clearTimeout(timer)
  }, [polls, dispatch])
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  return null
}
