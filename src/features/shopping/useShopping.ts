import { useRemovals } from '../removals/useRemovals'
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { shoppingApi, shoppingError, type ShoppingWrite } from '../../services/shopping-query'
import { additionCleared, additionPrepared } from './shopping-ui-slice'
import type { ShoppingItem } from './types'
import { executeShoppingWrite } from './shopping-actions'

export function useShopping() {
  const removal = useRemovals('shopping')
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const query = shoppingApi.endpoints.getShopping.useQueryState(undefined)
  const [, mutation] = shoppingApi.useChangeShoppingMutation({
    fixedCacheKey: 'shared-shopping-write',
  })
  const ui = useAppSelector((state) => state.shoppingUi)
  const mutate = (action: ShoppingWrite['action'], body: object) =>
    dispatch(executeShoppingWrite(action, body))
  return {
    items: query.data?.items ?? [],
    activity: query.data?.activity ?? [],
    loading: !query.data && (query.isUninitialized || query.isLoading),
    pending: ui.busy,
    error: shoppingError(mutation.error)?.message ?? shoppingError(query.error)?.message ?? '',
    failure: shoppingError(mutation.error) ?? shoppingError(query.error),
    feedback: ui.feedback,
    refresh: () => {
      mutation.reset()
      void dispatch(
        shoppingApi.endpoints.getShopping.initiate(undefined, {
          subscribe: false,
          forceRefetch: true,
        }),
      )
    },
    add: async (title: string, important = false) => {
      if (store.getState().shoppingUi.busy) return false
      if (
        store.getState().shoppingUi.addition?.title !== title ||
        store.getState().shoppingUi.addition?.important !== important
      )
        dispatch(additionPrepared({ title, important, requestKey: crypto.randomUUID() }))
      const saved = await mutate('add', store.getState().shoppingUi.addition!)
      if (saved) dispatch(additionCleared())
      return saved
    },
    edit: (item: ShoppingItem, title: string, important = item.important) =>
      mutate('edit', { id: item.id, version: item.version, title, important }),
    check: (item: ShoppingItem) =>
      mutate('check', { id: item.id, version: item.version, checked: !item.checked }),
    ...removal,
  }
}
