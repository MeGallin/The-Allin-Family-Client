import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { shoppingApi, type ShoppingWrite } from '../../services/shopping-query'
import { feedbackReceived, writeStarted, writeFinished } from './shopping-ui-slice'

export const executeShoppingWrite =
  (action: ShoppingWrite['action'], body: object) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    return executeWrite(dispatch, getState, {
      busy: (state) => state.shoppingUi.busy,
      start: () => {
        dispatch(writeStarted())
        dispatch(shoppingApi.util.getRunningQueryThunk('getShopping', undefined))?.abort()
      },
      request: () =>
        dispatch(
          shoppingApi.endpoints.changeShopping.initiate(
            { action, body },
            { fixedCacheKey: 'shared-shopping-write' },
          ),
        ).unwrap(),
      commit: async (data) => {
        await dispatch(shoppingApi.util.upsertQueryData('getShopping', undefined, data))
        dispatch(shoppingApi.util.invalidateTags(['Shopping']))
        dispatch(
          feedbackReceived(
            action === 'add'
              ? 'Item added to the shared list.'
              : action === 'edit'
                ? 'Item changes saved.'
                : action === 'remove'
                  ? 'Item removed. Its history has been kept.'
                  : 'Shopping status saved.',
          ),
        )
      },
      refresh: () =>
        dispatch(
          shoppingApi.endpoints.getShopping.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),

      finish: () => {
        dispatch(writeFinished())
      },
    })
  }
