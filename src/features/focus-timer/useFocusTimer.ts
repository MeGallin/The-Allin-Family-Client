import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { useOnline } from '../../hooks/useOnline'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { focusTimerApi } from '../../services/focus-timer-query'
import { shoppingError } from '../../services/shopping-query'
import { useRemovals } from '../removals/useRemovals'
import { executeFocusTimerWrite } from './focus-timer-actions'
import type { FocusWrite } from './types'
export function useFocusTimer() {
  const dispatch = useAppDispatch(),
    online = useOnline()
  const ownerId = useAppSelector((s) => s.auth.user?.id),
    ui = useAppSelector((s) => s.focusTimerUi)
  const live = useLiveQueryOptions('/my-space', ui.busy)
  const query = focusTimerApi.useGetFocusTimerQuery(ownerId ?? 0, {
    ...live,
    skip: !ownerId || live.skip,
  })
  const [, mutation] = focusTimerApi.useChangeFocusTimerMutation({
    fixedCacheKey: 'focus-timer-write',
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
      ? 'You’re offline. The timer is an estimate; reconnect before changing it.'
      : (failure?.message ?? ''),
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      if (ownerId)
        void dispatch(
          focusTimerApi.endpoints.getFocusTimer.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
    },
    write: (action: FocusWrite['action'], body: object) =>
      online ? dispatch(executeFocusTimerWrite({ action, body })) : Promise.resolve(null),
    ...useRemovals('focusTimer'),
  }
}
