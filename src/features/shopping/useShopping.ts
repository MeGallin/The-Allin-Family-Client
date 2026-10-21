import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { shoppingApi, shoppingError, type ShoppingWrite } from '../../services/shopping-query'
import { additionCleared, additionPrepared } from './shopping-ui-slice'
import type { ShoppingItem } from './types'
import { executeShoppingWrite } from './shopping-actions'
import { removalScheduled, removalUndone, REMOVAL_DELAY_MS } from './shopping-ui-slice'

export function useShopping() {
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
    add: async (title: string) => {
      if (store.getState().shoppingUi.busy) return false
      if (store.getState().shoppingUi.addition?.title !== title)
        dispatch(additionPrepared({ title, requestKey: crypto.randomUUID() }))
      const saved = await mutate('add', store.getState().shoppingUi.addition!)
      if (saved) dispatch(additionCleared())
      return saved
    },
    edit: (item: ShoppingItem, title: string) =>
      mutate('edit', { id: item.id, version: item.version, title }),
    check: (item: ShoppingItem) =>
      mutate('check', { id: item.id, version: item.version, checked: !item.checked }),
    removals: ui.removals,
    remove: (item: ShoppingItem) => {
      if (store.getState().shoppingUi.busy || store.getState().shoppingUi.removals[item.id]) return
      dispatch(
        removalScheduled({
          item,
          token: crypto.randomUUID(),
          deadline: Date.now() + REMOVAL_DELAY_MS,
          sending: false,
        }),
      )
    },
    undoRemove: (id: string) => {
      dispatch(removalUndone(id))
    },
  }
}
