import type { SudokuGame, SudokuProgress } from '../features/sudoku/types'
export const sudokuSolution =
  '123456789456789123789123456234567891567891234891234567345678912678912345912345678'
export function sudokuGame(empty = [0, 1, 9, 10]): SudokuGame {
  const entries = [...sudokuSolution]
  for (const cell of empty) entries[cell] = '0'
  return {
    id: '701',
    title: 'Sudoku',
    schemaVersion: 1,
    difficulty: 'easy',
    givens: entries.join(''),
    entries: entries.join(''),
    notes: Array(81).fill(0),
    paused: false,
    version: 1,
    completedAt: null,
    updatedAt: '2026-10-24T12:00:00Z',
  }
}
export const savedSudoku = (game: SudokuGame, progress: SudokuProgress): SudokuGame => ({
  ...game,
  ...progress,
  version: game.version + 1,
  completedAt: progress.entries === sudokuSolution ? '2026-10-24T12:01:00Z' : null,
})
