import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { AppDispatch, RootState } from '../../app/store'
import { removalAdapters } from './removal-adapters'
import { removalScheduled, removalSending, removalFinished } from './removals-slice'
export const removalListener = createListenerMiddleware()
const listen = removalListener.startListening.withTypes<RootState, AppDispatch>()
listen({
  actionCreator: removalScheduled,
  effect: async ({ payload: entry }, api) => {
    const { key, token, deadline, generation, ownerId, item } = entry
    if (api.getOriginalState().removals.entries[key]) return
    const current = () => {
      const state = api.getState()
      return (
        state.auth.user?.id === ownerId &&
        state.auth.generation === generation &&
        state.removals.entries[key]?.token === token
      )
    }
    await api.delay(Math.max(0, deadline - Date.now()))
    const adapter = removalAdapters[entry.domain]
    while (current() && adapter.busy(api.getState())) await api.delay(100)
    if (!current()) return
    const latest = adapter.latest(api.getState(), ownerId)
    const record = latest?.find((record) => record.id === item.id)
    if (latest && (!record || record.version !== item.version)) {
      api.dispatch(
        removalFinished({
          key,
          token,
          message:
            'Removal cancelled because this content changed or was already removed. Review it before trying again.',
        }),
      )
      return
    }
    api.dispatch(removalSending({ key, token }))
    const saved = await adapter.remove(api.dispatch, entry)
    if (current())
      api.dispatch(
        removalFinished({
          key,
          token,
          message: saved
            ? 'Removed. Its history has been kept.'
            : 'Removal could not be completed. Refresh and review the content before trying again.',
        }),
      )
  },
})
