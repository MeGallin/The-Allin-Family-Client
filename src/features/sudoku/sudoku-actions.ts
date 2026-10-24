import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { sudokuApi } from '../../services/sudoku-query'
import { sudokuWriteStarted, sudokuWriteFinished, sudokuSaved } from './sudoku-ui-slice'
import type { SudokuWrite } from './types'
export const executeSudokuWrite =
  (write: SudokuWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const ownerId = getState().auth.user?.id
    if (!ownerId) return false
    return executeWrite(dispatch, getState, {
      busy: (state) => state.sudokuUi.busy,
      start: () => {
        dispatch(sudokuWriteStarted())
        dispatch(sudokuApi.util.getRunningQueryThunk('getSudoku', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          sudokuApi.endpoints.changeSudoku.initiate(write, { fixedCacheKey: 'sudoku-write' }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Please sign in again.')
        await dispatch(sudokuApi.util.upsertQueryData('getSudoku', ownerId, data))
        dispatch(sudokuApi.util.invalidateTags([{ type: 'Sudoku', id: ownerId }]))
        dispatch(
          sudokuSaved(
            write.action === 'remove'
              ? 'Sudoku removed.'
              : write.action === 'install'
                ? 'Sudoku installed in My widgets.'
                : data.game?.completedAt
                  ? 'Puzzle completed. Your progress is saved.'
                  : 'Your Sudoku progress is saved.',
          ),
        )
      },
      refresh: () =>
        dispatch(
          sudokuApi.endpoints.getSudoku.initiate(ownerId, { subscribe: false, forceRefetch: true }),
        ),
      finish: () => {
        dispatch(sudokuWriteFinished())
      },
    })
  }
