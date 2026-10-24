export type SudokuDifficulty = 'easy' | 'medium' | 'hard'
export type SudokuProgress = { entries: string; notes: number[]; paused: boolean }
export type SudokuGame = SudokuProgress & {
  id: string
  title: 'Sudoku'
  schemaVersion: 1
  difficulty: SudokuDifficulty
  givens: string
  version: number
  completedAt: string | null
  updatedAt: string
}
export type SudokuSnapshot = {
  ownerId: number
  installationVersion: number
  game: SudokuGame | null
}
export type SudokuWrite = {
  action: 'install' | 'save' | 'new' | 'restart' | 'remove'
  body: object
}
export const sudokuLevels: { id: SudokuDifficulty; label: string; clues: number }[] = [
  { id: 'easy', label: 'Easy', clues: 42 },
  { id: 'medium', label: 'Medium', clues: 36 },
  { id: 'hard', label: 'Hard', clues: 30 },
]
export const SUDOKU_PATH = '/my-space?view=widgets&tool=sudoku'
