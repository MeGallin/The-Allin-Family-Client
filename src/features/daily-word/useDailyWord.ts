import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { useOnline } from '../../hooks/useOnline'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { dailyWordApi } from '../../services/daily-word-query'
import { shoppingError } from '../../services/shopping-query'
import { useRemovals } from '../removals/useRemovals'
import { executeDailyWordWrite } from './daily-word-actions'
import type { WordWrite } from './types'
export function useDailyWord() {
  const dispatch = useAppDispatch(),
    online = useOnline()
  const ownerId = useAppSelector((s) => s.auth.user?.id),
    ui = useAppSelector((s) => s.dailyWordUi)
  const live = useLiveQueryOptions('/my-space', ui.busy)
  const query = dailyWordApi.useGetDailyWordQuery(ownerId ?? 0, {
    ...live,
    skip: !ownerId || live.skip,
  })
  const [, mutation] = dailyWordApi.useChangeDailyWordMutation({
    fixedCacheKey: 'daily-word-write',
  })
  const data = query.data?.ownerId === ownerId ? query.data : undefined
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  return {
    ownerId,
    data,
    known: !!data,
    installed: !!data?.installed,
    pending: ui.busy,
    feedback: ui.feedback,
    loading: online && !data && (query.isUninitialized || query.isLoading),
    offline: !online,
    failure,
    error: !online
      ? 'You’re offline. Your typed word is kept; reconnect before submitting.'
      : (failure?.message ?? ''),
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      if (ownerId)
        void dispatch(
          dailyWordApi.endpoints.getDailyWord.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
    },
    write: (action: WordWrite['action'], body: object) =>
      online ? dispatch(executeDailyWordWrite({ action, body })) : Promise.resolve(null),
    ...useRemovals('dailyWord'),
  }
}
