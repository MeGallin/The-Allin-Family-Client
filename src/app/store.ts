import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import auth from '../features/auth/auth-slice'
import pollsUi from '../features/polls/polls-ui-slice'
import shoppingUi from '../features/shopping/shopping-ui-slice'
import calendarUi from '../features/calendar/calendar-ui-slice'
import memoriesUi from '../features/memories/memories-ui-slice'
import notesUi from '../features/notes/notes-ui-slice'
import membersUi from '../features/members/members-ui-slice'
import { shoppingApi } from '../services/shopping-query'
import { removalListener } from '../features/removals/removal-listener'
import removals from '../features/removals/removals-slice'

export const store = configureStore({
  reducer: {
    auth,
    pollsUi,
    shoppingUi,
    calendarUi,
    memoriesUi,
    notesUi,
    membersUi,
    removals,
    [shoppingApi.reducerPath]: shoppingApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().prepend(removalListener.middleware).concat(shoppingApi.middleware),
  devTools: import.meta.env.DEV,
})
setupListeners(store.dispatch)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
