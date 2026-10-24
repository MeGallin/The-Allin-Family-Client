import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { useOnline } from '../../hooks/useOnline'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { sudokuApi } from '../../services/sudoku-query'
import { shoppingError } from '../../services/shopping-query'
import { useRemovals } from '../removals/useRemovals'
import { executeSudokuWrite } from './sudoku-actions'
import type { SudokuDifficulty, SudokuGame, SudokuProgress, SudokuWrite } from './types'
export function useSudoku() {
  const dispatch = useAppDispatch(),
    store = useAppStore(),
    online = useOnline()
  const ownerId = useAppSelector((state) => state.auth.user?.id),
    ui = useAppSelector((state) => state.sudokuUi)
  const live = useLiveQueryOptions('/my-space', ui.busy)
  const query = sudokuApi.useGetSudokuQuery(ownerId ?? 0, { ...live, skip: !ownerId || live.skip })
  const [, mutation] = sudokuApi.useChangeSudokuMutation({ fixedCacheKey: 'sudoku-write' })
  const data = query.data?.ownerId === ownerId ? query.data : undefined
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  const removal = useRemovals('sudoku')
  async function write(action: SudokuWrite['action'], body: object) {
    if (!online) return null
    if (!(await dispatch(executeSudokuWrite({ action, body })))) return null
    return sudokuApi.endpoints.getSudoku.select(ownerId ?? 0)(store.getState()).data ?? null
  }
  return {
    ownerId,
    installationVersion: data?.installationVersion ?? 0,
    game: data?.game ?? null,
    known: !!data,
    pending: ui.busy,
    feedback: ui.feedback,
    loading: online && !data && (query.isUninitialized || query.isLoading),
    offline: !online,
    failure,
    error: !online
      ? 'You’re offline. Your local board is kept; reconnect before saving.'
      : (failure?.message ?? ''),
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      if (ownerId)
        void dispatch(
          sudokuApi.endpoints.getSudoku.initiate(ownerId, { subscribe: false, forceRefetch: true }),
        )
    },
    install: (difficulty: SudokuDifficulty, requestKey: string, version: number) =>
      write('install', { difficulty, version, requestKey }),
    save: (game: SudokuGame, progress: SudokuProgress, requestKey: string) =>
      write('save', { id: game.id, version: game.version, ...progress, requestKey }),
    newGame: (game: SudokuGame, difficulty: SudokuDifficulty, requestKey: string) =>
      write('new', { id: game.id, version: game.version, difficulty, requestKey }),
    restart: (game: SudokuGame, requestKey: string) =>
      write('restart', { id: game.id, version: game.version, requestKey }),
    ...removal,
  }
}
