import { dailyWordApi } from '../../services/daily-word-query'
import { focusTimerApi } from '../../services/focus-timer-query'
import { executeFocusTimerWrite } from '../focus-timer/focus-timer-actions'
import { executeDailyWordWrite } from '../daily-word/daily-word-actions'
import { sudokuApi } from '../../services/sudoku-query'
import { executeSudokuWrite } from '../sudoku/sudoku-actions'
import { pollsApi } from '../../services/polls-query'
import { executePollWrite } from '../polls/polls-actions'
import type { AppDispatch, RootState } from '../../app/store'
import { shoppingApi } from '../../services/shopping-query'
import { calendarApi } from '../../services/calendar-query'
import { memoriesApi } from '../../services/memories-query'
import { notesApi } from '../../services/notes-query'
import { widgetsApi } from '../../services/widgets-query'
import { executeWidgetWrite } from '../widgets/widgets-actions'
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
  focusTimer: {
    busy: (state) => state.focusTimerUi.busy,
    latest: (state, ownerId) => {
      const data = focusTimerApi.endpoints.getFocusTimer.select(ownerId)(state).data
      return data
        ? data.installed
          ? [{ id: 'focus-timer', title: 'Focus Timer', version: data.version }]
          : []
        : undefined
    },
    remove: async (dispatch, entry) =>
      !!(
        await dispatch(async (send, getState) => {
          const data = focusTimerApi.endpoints.getFocusTimer.select(entry.ownerId)(getState()).data
          if (!data || data.version !== entry.item.version) return null
          return send(
            executeFocusTimerWrite({
              action: 'remove',
              body: {
                version: entry.item.version,
                generation: data.generation,
                sessionId: data.session?.id ?? null,
                requestKey: entry.token,
              },
            }),
          )
        })
      )?.receipt,
  },
  dailyWord: {
    busy: (state) => state.dailyWordUi.busy,
    latest: (state, ownerId) => {
      const data = dailyWordApi.endpoints.getDailyWord.select(ownerId)(state).data
      return data
        ? data.installed
          ? [{ id: 'daily-word', title: 'Daily Word', version: data.installationVersion }]
          : []
        : undefined
    },
    remove: async (dispatch, entry) =>
      !!(
        await dispatch(
          executeDailyWordWrite({
            action: 'remove',
            body: { version: entry.item.version, requestKey: entry.token },
          }),
        )
      ).receipt,
  },
  sudoku: {
    busy: (state) => state.sudokuUi.busy,
    latest: (state, ownerId) => {
      const data = sudokuApi.endpoints.getSudoku.select(ownerId)(state).data
      return data ? (data.game ? [data.game] : []) : undefined
    },
    remove: (dispatch, entry) =>
      dispatch(
        executeSudokuWrite({ action: 'remove', body: { ...body(entry), requestKey: entry.token } }),
      ),
  },
  widgets: {
    busy: (state) => state.widgetsUi.busy,
    latest: (state, ownerId) =>
      widgetsApi.endpoints.getWidgets.select(ownerId)(state).data?.widgets,
    remove: (dispatch, entry) =>
      dispatch(executeWidgetWrite({ action: 'remove', body: body(entry) })),
  },
  widgetMeals: {
    busy: (state) => state.widgetsUi.busy,
    latest: (state, ownerId) =>
      widgetsApi.endpoints.getWidgets
        .select(ownerId)(state)
        .data?.widgets.flatMap((widget) =>
          widget.meals.map((meal) => ({ ...meal, version: widget.version })),
        ),
    remove: (dispatch, entry) =>
      dispatch(async (_, getState) => {
        const widget = widgetsApi.endpoints.getWidgets
          .select(entry.ownerId)(getState())
          .data?.widgets.find((widget) => widget.meals.some((meal) => meal.id === entry.item.id))
        return widget
          ? dispatch(
              executeWidgetWrite({
                action: 'remove-meal',
                body: { id: widget.id, version: entry.item.version, mealId: entry.item.id },
              }),
            )
          : false
      }),
  },
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
