export type NonogramPuzzle = {
  puzzleId: string
  name: string
  size: 5 | 10
  rowClues: number[][]
  columnClues: number[][]
}
export type NonogramGame = NonogramPuzzle & {
  id: 'nonograms'
  title: 'Nonograms'
  version: number
  cells: string
  assisted: boolean
  completedAt: string | null
  updatedAt: string
  replay: boolean
}
export type NonogramSnapshot = {
  ownerId: number
  installationVersion: number
  game: NonogramGame | null
  played: string[]
  catalogue: (NonogramPuzzle & { played: boolean })[]
}
export type NonogramWrite = {
  action: 'install' | 'save' | 'new' | 'restart' | 'remove'
  body: Record<string, unknown>
}
export const NONOGRAM_PATH = '/my-space?view=widgets&tool=nonograms'
