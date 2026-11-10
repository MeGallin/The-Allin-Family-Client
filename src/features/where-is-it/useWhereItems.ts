import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useOnline } from '../../hooks/useOnline'
import { whereApi } from '../../services/where-is-it-query'
import { shoppingError } from '../../services/shopping-query'
import { useRemovals } from '../removals/useRemovals'
import { executeWhereWrite, whereBusy } from './where-actions'
import type { WhereWrite } from './types'

export function useWhereItems() {
  const ownerId = useAppSelector((state) => state.auth.user?.id)
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const pending = useAppSelector(whereBusy)
  const online = useOnline()
  const live = useLiveQueryOptions('/my-space', pending)
  const query = whereApi.useGetWhereItemsQuery(ownerId ?? 0, {
    ...live,
    skip: !ownerId || live.skip,
  })
  const [, mutation] = whereApi.useChangeWhereItemMutation({ fixedCacheKey: 'where-write' })
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  const data = query.currentData?.ownerId === ownerId ? query.currentData : undefined
  return {
    items: data?.items ?? [],
    loading: !data && query.isLoading,
    known: !!data,
    pending,
    offline: !online,
    failure,
    error: !online ? 'You’re offline. Reconnect before saving.' : (failure?.message ?? ''),
    clearError: mutation.reset,
    refresh: () => {
      if (ownerId)
        void dispatch(
          whereApi.endpoints.getWhereItems.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
    },
    save: (write: WhereWrite) => dispatch(executeWhereWrite(write)),
    lastFailure: () =>
      shoppingError(
        whereApi.endpoints.changeWhereItem.select('where-write')(store.getState()).error,
      ),
    ...useRemovals('whereItems'),
  }
}
