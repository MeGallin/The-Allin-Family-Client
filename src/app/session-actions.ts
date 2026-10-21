import type { AppDispatch } from './store'
import { shoppingApi } from '../services/shopping-query'
import { shoppingUiReset } from '../features/shopping/shopping-ui-slice'
import { calendarUiReset } from '../features/calendar/calendar-ui-slice'
import { userReceived } from '../features/auth/auth-slice'
import { familyReset } from '../features/family/family-slice'
import { abortMemoryWrites } from '../services/memories-api'
import { memoriesUiReset } from '../features/memories/memories-ui-slice'

export function clearPrivateState(dispatch: AppDispatch) {
  abortMemoryWrites()
  dispatch(shoppingApi.util.getRunningQueriesThunk()).forEach((request) => request.abort())
  dispatch(shoppingApi.util.getRunningMutationsThunk()).forEach((request) => request.abort())
  dispatch(shoppingApi.util.resetApiState())
  dispatch(shoppingUiReset())
  dispatch(calendarUiReset())
  dispatch(memoriesUiReset())
  dispatch(familyReset())
  dispatch(userReceived(null))
}
