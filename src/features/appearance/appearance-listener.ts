import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '../../app/store'
import { userReceived } from '../auth/auth-slice'
import { appearanceLoaded } from './appearance-slice'
import { DEFAULT_ACCENT } from './accent-options'
import { readAccentPreference } from '../../services/appearance-storage'
export const appearanceListener = createListenerMiddleware()
const listen = appearanceListener.startListening.withTypes<RootState, AppDispatch>()
listen({
  actionCreator: userReceived,
  effect: (_action, api) => {
    const { auth, appearance } = api.getState()
    const ownerId = auth.user?.id ?? null
    // Profile refreshes must not replace an in-memory choice when storage is blocked.
    if (appearance.ownerId === ownerId) return
    api.dispatch(
      appearanceLoaded({
        ownerId,
        ...(ownerId ? readAccentPreference(ownerId) : { accent: DEFAULT_ACCENT, persisted: true }),
      }),
    )
  },
})
