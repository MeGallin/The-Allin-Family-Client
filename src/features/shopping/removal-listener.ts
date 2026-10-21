import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from '../../app/store'
import { shoppingApi } from '../../services/shopping-query'
import { executeShoppingWrite } from './shopping-actions'
import {
  feedbackReceived,
  removalScheduled,
  removalSending,
  removalFinished,
} from './shopping-ui-slice'

export const removalListener = createListenerMiddleware()
const listen = removalListener.startListening.withTypes<RootState, AppDispatch>()
listen({
  actionCreator: removalScheduled,
  effect: async ({ payload }, api) => {
    const { item, token, deadline } = payload
    const generation = api.getState().auth.generation
    // Duplicate schedule actions must not start a second write for the same item.
    if (api.getOriginalState().shoppingUi.removals[item.id]) return
    await api.delay(Math.max(0, deadline - Date.now()))
    const current = () => {
      const state = api.getState()
      return (
        state.auth.user &&
        state.auth.generation === generation &&
        state.shoppingUi.removals[item.id]?.token === token
      )
    }
    while (current() && api.getState().shoppingUi.busy) await api.delay(100)
    if (!current()) return
    const latest = shoppingApi.endpoints.getShopping.select()(api.getState()).data
    const latestItem = latest?.items.find((entry) => entry.id === item.id)
    if (latest && (!latestItem || latestItem.version !== item.version)) {
      api.dispatch(removalFinished({ id: item.id, token }))
      api.dispatch(
        feedbackReceived('Removal cancelled because someone else changed or removed this item.'),
      )
      return
    }
    api.dispatch(removalSending({ id: item.id, token }))
    await api.dispatch(executeShoppingWrite('remove', { id: item.id, version: item.version }))
    api.dispatch(removalFinished({ id: item.id, token }))
  },
})
