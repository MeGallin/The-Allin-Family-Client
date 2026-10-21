import { pollsApi } from '../../services/polls-query'
import { executePollWrite } from '../polls/polls-actions'
import type { AppDispatch, RootState } from '../../app/store'
import { shoppingApi } from '../../services/shopping-query'
import { calendarApi } from '../../services/calendar-query'
import { memoriesApi } from '../../services/memories-query'
import { notesApi } from '../../services/notes-query'
import { executeShoppingWrite } from '../shopping/shopping-actions'
import { executeCalendarWrite } from '../calendar/calendar-actions'
import { executeMemoryWrite } from '../memories/memories-actions'
import { executeNoteWrite } from '../notes/notes-actions'
import type { PendingRemoval, RemovalDomain, RemovalRecord } from './removals-slice'
type Adapter = {
  busy: (state: RootState) => boolean
  latest: (state: RootState, ownerId: number) => RemovalRecord[] | undefined
  remove: (dispatch: AppDispatch, entry: PendingRemoval) => Promise<boolean>
}
const body = ({ item }: PendingRemoval) => ({ id: item.id, version: item.version })
/** Only domain differences live here; timing, Undo and safety checks live in the listener. */
export const removalAdapters: Record<RemovalDomain, Adapter> = {
  polls: {
    busy: (state) => state.pollsUi.busy,
    latest: (state) => pollsApi.endpoints.getPolls.select()(state).data?.polls,
    remove: (dispatch, entry) =>
      dispatch(executePollWrite({ action: 'remove', body: body(entry) })),
  },
  shopping: {
    busy: (state) => state.shoppingUi.busy,
    latest: (state) => shoppingApi.endpoints.getShopping.select()(state).data?.items,
    remove: (dispatch, entry) => dispatch(executeShoppingWrite('remove', body(entry))),
  },
  calendar: {
    busy: (state) => state.calendarUi.busy,
    latest: (state) => calendarApi.endpoints.getCalendar.select()(state).data?.events,
    remove: (dispatch, entry) => dispatch(executeCalendarWrite('remove', body(entry))),
  },
  memories: {
    busy: (state) => state.memoriesUi.busy,
    latest: (state) => memoriesApi.endpoints.getMemories.select()(state).data?.memories,
    remove: (dispatch, entry) => dispatch(executeMemoryWrite('remove', body(entry))),
  },
  notes: {
    busy: (state) => state.notesUi.busy,
    latest: (state, ownerId) => notesApi.endpoints.getNotes.select(ownerId)(state).data?.notes,
    remove: (dispatch, entry) =>
      dispatch(executeNoteWrite({ action: 'remove', body: body(entry) })),
  },
}
