import { useEffect } from 'react'
import { memoriesApi } from '../../services/memories-query'
import { useMemories } from './useMemories'
export function MemoriesSync({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { pending, failure } = useMemories()
  memoriesApi.useGetMemoriesQuery(undefined, {
    pollingInterval: pending ? 0 : 15000,
    skipPollingIfUnfocused: true,
  })
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  return null
}
