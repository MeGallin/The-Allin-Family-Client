import type { AppDispatch, RootState } from '../../app/store'
import { calendarApi, type CalendarWrite } from '../../services/calendar-query'
import { shoppingError } from '../../services/shopping-query'
import { calendarWriteStarted, calendarWriteFinished, calendarFeedback } from './calendar-ui-slice'

export const executeCalendarWrite =
  (action: CalendarWrite['action'], body: object) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    if (getState().calendarUi.busy) return false
    const generation = getState().auth.generation
    dispatch(calendarWriteStarted())
    dispatch(calendarApi.util.getRunningQueryThunk('getCalendar', undefined))?.abort()
    try {
      const data = await dispatch(
        calendarApi.endpoints.changeCalendar.initiate(
          { action, body },
          { fixedCacheKey: 'shared-calendar-write' },
        ),
      ).unwrap()
      if (generation !== getState().auth.generation) return false
      await dispatch(calendarApi.util.upsertQueryData('getCalendar', undefined, data))
      dispatch(calendarApi.util.invalidateTags(['Calendar']))
      dispatch(
        calendarFeedback(
          action === 'add'
            ? 'Event added to the family calendar.'
            : action === 'edit'
              ? 'Event changes saved for everyone.'
              : 'Event removed. Its history has been kept.',
        ),
      )
      return true
    } catch (error) {
      if (generation === getState().auth.generation && shoppingError(error)?.status === 409)
        await dispatch(
          calendarApi.endpoints.getCalendar.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
      return false
    } finally {
      if (generation === getState().auth.generation) dispatch(calendarWriteFinished())
    }
  }
