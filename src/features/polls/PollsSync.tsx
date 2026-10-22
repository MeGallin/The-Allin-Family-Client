import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useEffect } from 'react'
import { pollsApi } from '../../services/polls-query'
import { usePolls } from './usePolls'
export function PollsSync({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { pending, failure } = usePolls()
  pollsApi.useGetPollsQuery(undefined, useLiveQueryOptions('/polls', pending))
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  return null
}
