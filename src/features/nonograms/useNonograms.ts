import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { useOnline } from '../../hooks/useOnline'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { nonogramApi } from '../../services/nonograms-query'
import { shoppingError } from '../../services/shopping-query'
import { useRemovals } from '../removals/useRemovals'
import { executeNonogramWrite } from './nonograms-actions'
import type { NonogramWrite } from './types'
export function useNonograms() {
  const dispatch = useAppDispatch(),
    ownerId = useAppSelector((state) => state.auth.user?.id),
    ui = useAppSelector((state) => state.nonogramUi),
    online = useOnline()
  const live = useLiveQueryOptions('/my-space', ui.busy)
  const query = nonogramApi.useGetNonogramQuery(ownerId ?? 0, {
    ...live,
    skip: !ownerId || live.skip,
  })
  const data = query.data?.ownerId === ownerId ? query.data : undefined
  const [, mutation] = nonogramApi.useChangeNonogramMutation({ fixedCacheKey: 'nonogram-write' })
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  const removals = useRemovals('nonograms')
  return {
    ownerId,
    ui,
    data,
    game: data?.game ?? null,
    known: !!data,
    offline: !online,
    pending: ui.busy,
    loading: online && !data && (query.isUninitialized || query.isLoading),
    failure,
    error:
      ui.error ||
      (!online
        ? 'You’re offline. Unsaved marks stay here until you reconnect.'
        : (failure?.message ?? '')),
    clearError: mutation.reset,
    refresh: async () => {
      if (!ownerId) return null
      try {
        return await dispatch(
          nonogramApi.endpoints.getNonogram.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        ).unwrap()
      } catch {
        return null
      }
    },
    write: (write: NonogramWrite) =>
      online ? dispatch(executeNonogramWrite(write)) : Promise.resolve(false),
    ...removals,
  }
}
