import { clearSnapshotResponses } from '../services/api-client'
import { removalsReset } from '../features/removals/removals-slice'
import type { AppDispatch } from './store'
import { shoppingApi } from '../services/shopping-query'
import { shoppingUiReset } from '../features/shopping/shopping-ui-slice'
import { calendarUiReset } from '../features/calendar/calendar-ui-slice'
import { userReceived } from '../features/auth/auth-slice'
import { pollsUiReset } from '../features/polls/polls-ui-slice'
import { abortMemoryWrites } from '../services/memories-api'
import { memoriesUiReset } from '../features/memories/memories-ui-slice'
import { notesUiReset } from '../features/notes/notes-ui-slice'
import { sudokuUiReset } from '../features/sudoku/sudoku-ui-slice'
import { widgetsUiReset } from '../features/widgets/widgets-ui-slice'
import { membersUiReset } from '../features/members/members-ui-slice'

export function clearPrivateState(dispatch: AppDispatch) {
  clearSnapshotResponses()
  dispatch(removalsReset())
  abortMemoryWrites()
  dispatch(shoppingApi.util.getRunningQueriesThunk()).forEach((request) => request.abort())
  dispatch(shoppingApi.util.getRunningMutationsThunk()).forEach((request) => request.abort())
  dispatch(shoppingApi.util.resetApiState())
  dispatch(shoppingUiReset())
  dispatch(calendarUiReset())
  dispatch(memoriesUiReset())
  dispatch(notesUiReset())
  dispatch(widgetsUiReset())
  dispatch(sudokuUiReset())
  dispatch(membersUiReset())
  dispatch(pollsUiReset())
  dispatch(userReceived(null))
}
