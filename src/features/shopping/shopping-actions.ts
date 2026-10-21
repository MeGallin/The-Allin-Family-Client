import type { AppDispatch, RootState } from '../../app/store'
import { shoppingApi, shoppingError, type ShoppingWrite } from '../../services/shopping-query'
import { feedbackReceived, writeStarted, writeFinished } from './shopping-ui-slice'

export const executeShoppingWrite =
  (action: ShoppingWrite['action'], body: object) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    if (getState().shoppingUi.busy) return false
    const generation = getState().auth.generation
    dispatch(writeStarted())
    dispatch(shoppingApi.util.getRunningQueryThunk('getShopping', undefined))?.abort()
    try {
      const data = await dispatch(
        shoppingApi.endpoints.changeShopping.initiate(
          { action, body },
          { fixedCacheKey: 'shared-shopping-write' },
        ),
      ).unwrap()
      if (generation !== getState().auth.generation) return false
      await dispatch(shoppingApi.util.upsertQueryData('getShopping', undefined, data))
      dispatch(shoppingApi.util.invalidateTags(['Shopping']))
      dispatch(
        feedbackReceived(
          action === 'add'
            ? 'Item added to the shared list.'
            : action === 'edit'
              ? 'Item name saved.'
              : action === 'remove'
                ? 'Item removed. Its history has been kept.'
                : 'Shopping status saved.',
        ),
      )
      return true
    } catch (error) {
      if (generation === getState().auth.generation && shoppingError(error)?.status === 409)
        await dispatch(
          shoppingApi.endpoints.getShopping.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
      return false
    } finally {
      if (generation === getState().auth.generation) dispatch(writeFinished())
    }
  }
