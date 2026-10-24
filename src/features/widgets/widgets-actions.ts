import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { widgetsApi } from '../../services/widgets-query'
import { widgetWriteStarted, widgetWriteFinished, widgetSaved } from './widgets-ui-slice'
import type { WidgetWrite } from './types'
export const executeWidgetWrite =
  (write: WidgetWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const ownerId = getState().auth.user?.id
    if (!ownerId) return false
    return executeWrite(dispatch, getState, {
      busy: (state) => state.widgetsUi.busy,
      start: () => {
        dispatch(widgetWriteStarted())
        dispatch(widgetsApi.util.getRunningQueryThunk('getWidgets', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          widgetsApi.endpoints.changeWidget.initiate(write, { fixedCacheKey: 'widget-write' }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Please sign in again.')
        await dispatch(widgetsApi.util.upsertQueryData('getWidgets', ownerId, data))
        dispatch(widgetsApi.util.invalidateTags([{ type: 'Widgets', id: ownerId }]))
        dispatch(
          widgetSaved({
            spin: data.selectedSpin,
            message:
              write.action === 'spin'
                ? 'Your trial pick is saved privately.'
                : write.action === 'add'
                  ? 'Widget installed in My widgets.'
                  : write.action === 'publish'
                    ? 'Dinner suggestion published to Home and Family widgets. The family can now respond.'
                    : write.action === 'eaten'
                      ? 'Your meal diary is saved.'
                      : write.action === 'respond'
                        ? 'Your dinner response is saved.'
                        : 'Your changes are saved.',
          }),
        )
      },
      refresh: () =>
        dispatch(
          widgetsApi.endpoints.getWidgets.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),
      finish: () => {
        dispatch(widgetWriteFinished())
      },
    })
  }
