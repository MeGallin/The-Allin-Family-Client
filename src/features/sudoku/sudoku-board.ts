import type { SudokuGame, SudokuProgress } from './types'
export const progressOf = (game: SudokuGame): SudokuProgress => ({
  entries: game.entries,
  notes: [...game.notes],
  paused: game.paused,
})
export const sameProgress = (a: SudokuProgress, b: SudokuProgress) =>
  a.entries === b.entries &&
  a.paused === b.paused &&
  a.notes.every((mask, index) => mask === b.notes[index])
export function peers(a: number, b: number) {
  return (
    Math.floor(a / 9) === Math.floor(b / 9) ||
    a % 9 === b % 9 ||
    (Math.floor(a / 27) === Math.floor(b / 27) &&
      Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3))
  )
}
export function conflicts(entries: string) {
  const result = new Set<number>()
  for (let i = 0; i < 81; i++)
    if (entries[i] !== '0')
      for (let j = i + 1; j < 81; j++)
        if (entries[i] === entries[j] && peers(i, j)) {
          result.add(i)
          result.add(j)
        }
  return result
}
export function enterDigit(
  progress: SudokuProgress,
  givens: string,
  cell: number,
  digit: number,
  pencil: boolean,
): SudokuProgress {
  if (givens[cell] !== '0' || progress.paused) return progress
  const entries = progress.entries.split(''),
    notes = [...progress.notes]
  if (pencil && digit) {
    entries[cell] = '0'
    notes[cell] ^= 1 << (digit - 1)
  } else {
    entries[cell] = String(digit)
    notes[cell] = 0
  }
  return { ...progress, entries: entries.join(''), notes }
}
export function moveCell(cell: number, key: string, control: boolean) {
  const row = Math.floor(cell / 9),
    column = cell % 9
  switch (key) {
    case 'ArrowLeft':
      return row * 9 + Math.max(0, column - 1)
    case 'ArrowRight':
      return row * 9 + Math.min(8, column + 1)
    case 'ArrowUp':
      return Math.max(0, cell - 9)
    case 'ArrowDown':
      return Math.min(80, cell + 9)
    case 'Home':
      return control ? 0 : row * 9
    case 'End':
      return control ? 80 : row * 9 + 8
    default:
      return cell
  }
}
