import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import auth from '../features/auth/auth-slice'
import family from '../features/family/family-slice'
import shoppingUi from '../features/shopping/shopping-ui-slice'
import calendarUi from '../features/calendar/calendar-ui-slice'
import { shoppingApi } from '../services/shopping-query'
import { removalListener } from '../features/shopping/removal-listener'

export const store = configureStore({
  reducer: { auth, family, shoppingUi, calendarUi, [shoppingApi.reducerPath]: shoppingApi.reducer },
  middleware: (getDefault) =>
    getDefault().prepend(removalListener.middleware).concat(shoppingApi.middleware),
  devTools: import.meta.env.DEV,
})
setupListeners(store.dispatch)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
