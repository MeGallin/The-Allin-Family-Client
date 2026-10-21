import { useRemovals } from '../removals/useRemovals'
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { calendarApi } from '../../services/calendar-query'
import { shoppingError } from '../../services/shopping-query'
import { executeCalendarWrite } from './calendar-actions'
import { calendarAdditionPrepared, calendarAdditionCleared } from './calendar-ui-slice'
import type { EventDraft, FamilyEvent } from './types'

export function useCalendar() {
  const removal = useRemovals('calendar')
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const query = calendarApi.endpoints.getCalendar.useQueryState(undefined)
  const [, mutation] = calendarApi.useChangeCalendarMutation({
    fixedCacheKey: 'shared-calendar-write',
  })
  const ui = useAppSelector((state) => state.calendarUi)
  return {
    events: query.data?.events ?? [],
    activity: query.data?.activity ?? [],
    loading: !query.data && (query.isUninitialized || query.isLoading),
    pending: ui.busy,
    feedback: ui.feedback,
    error: shoppingError(mutation.error)?.message ?? shoppingError(query.error)?.message ?? '',
    failure: shoppingError(mutation.error) ?? shoppingError(query.error),
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      void dispatch(
        calendarApi.endpoints.getCalendar.initiate(undefined, {
          subscribe: false,
          forceRefetch: true,
        }),
      )
    },
    add: async (draft: EventDraft) => {
      if (store.getState().calendarUi.busy) return false
      const old = store.getState().calendarUi.addition
      if (
        !old ||
        old.title !== draft.title ||
        old.startsAt !== draft.startsAt ||
        old.allDay !== draft.allDay ||
        old.annually !== draft.annually ||
        old.timeZone !== draft.timeZone ||
        old.detail !== draft.detail
      )
        dispatch(calendarAdditionPrepared({ ...draft, requestKey: crypto.randomUUID() }))
      const saved = await dispatch(
        executeCalendarWrite('add', store.getState().calendarUi.addition!),
      )
      if (saved) dispatch(calendarAdditionCleared())
      return saved
    },
    edit: (event: FamilyEvent, draft: EventDraft) =>
      dispatch(executeCalendarWrite('edit', { ...draft, id: event.id, version: event.version })),
    ...removal,
  }
}
