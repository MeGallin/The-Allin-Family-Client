import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { calendarApi, type CalendarWrite } from '../../services/calendar-query'

import { calendarWriteStarted, calendarWriteFinished, calendarFeedback } from './calendar-ui-slice'

export const executeCalendarWrite =
  (action: CalendarWrite['action'], body: object) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    return executeWrite(getState, {
      busy: (state) => state.calendarUi.busy,
      start: () => {
        dispatch(calendarWriteStarted())
        dispatch(calendarApi.util.getRunningQueryThunk('getCalendar', undefined))?.abort()
      },
      request: () =>
        dispatch(
          calendarApi.endpoints.changeCalendar.initiate(
            { action, body },
            { fixedCacheKey: 'shared-calendar-write' },
          ),
        ).unwrap(),
      commit: async (data) => {
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
      },
      refresh: () =>
        dispatch(
          calendarApi.endpoints.getCalendar.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),

      finish: () => {
        dispatch(calendarWriteFinished())
      },
    })
  }
