import type { NonogramPuzzle } from './types'
export function clue(line: string): number[] {
  return line.match(/1+/g)?.map((run) => run.length) ?? [0]
}
export function lineCandidates(size: number, clues: number[]): string[] {
  const result: string[] = []
  for (let mask = 0; mask < 2 ** size; mask++) {
    const line = mask.toString(2).padStart(size, '0')
    if (JSON.stringify(clue(line)) === JSON.stringify(clues)) result.push(line)
  }
  return result
}
/** Repeated line overlap/elimination. No guess or branch is used. */
export function logicalSolution(puzzle: NonogramPuzzle): string | null {
  const n = puzzle.size,
    cells = Array<string>(n * n).fill('?')
  const lines = [...puzzle.rowClues, ...puzzle.columnClues].map((numbers) =>
    lineCandidates(n, numbers),
  )
  const index = (line: number, offset: number) =>
    line < n ? line * n + offset : offset * n + line - n
  let changed = true
  while (changed) {
    changed = false
    for (let l = 0; l < lines.length; l++) {
      lines[l] = lines[l].filter((candidate) =>
        [...candidate].every((v, o) => cells[index(l, o)] === '?' || cells[index(l, o)] === v),
      )
      if (!lines[l].length) return null
      for (let o = 0; o < n; o++) {
        const value = lines[l][0][o],
          i = index(l, o)
        if (cells[i] === '?' && lines[l].every((candidate) => candidate[o] === value)) {
          cells[i] = value
          changed = true
        }
      }
    }
  }
  return cells.includes('?') ? null : cells.join('')
}
export function correctPattern(cells: string, solution: string): boolean {
  return [...cells].every((value, i) => (value === '1') === (solution[i] === '1'))
}
