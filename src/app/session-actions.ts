import type { AppDispatch } from './store'
import { shoppingApi } from '../services/shopping-query'
import { shoppingUiReset } from '../features/shopping/shopping-ui-slice'
import { calendarUiReset } from '../features/calendar/calendar-ui-slice'
import { userReceived } from '../features/auth/auth-slice'
import { familyReset } from '../features/family/family-slice'
import { releasePreviewImages } from '../features/family/preview-images'

export function clearPrivateState(dispatch: AppDispatch) {
  dispatch(shoppingApi.util.getRunningQueriesThunk()).forEach((request) => request.abort())
  dispatch(shoppingApi.util.getRunningMutationsThunk()).forEach((request) => request.abort())
  dispatch(shoppingApi.util.resetApiState())
  dispatch(shoppingUiReset())
  dispatch(calendarUiReset())
  releasePreviewImages()
  dispatch(familyReset())
  dispatch(userReceived(null))
}
