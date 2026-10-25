export type WordMark = 'correct' | 'present' | 'absent'
export type WordProgress = {
  guesses: { word: string; marks: WordMark[] }[]
  revision: number
  finished: boolean
  solved: boolean
  shared: boolean
}
export type WordClock = { currentDay: string; serverTime: string; nextMidnight: string }
export type WordSnapshot = {
  ownerId: number
  installationVersion: number
  installed: boolean
  day: string
  clock: WordClock
  progress: WordProgress
  week: {
    date: string
    revision: number
    shared: boolean
    attempts: number
    finished: boolean
    solved: boolean
  }[]
}
export type WordReceipt = Omit<WordSnapshot, 'week' | 'progress'> & {
  progress: WordProgress | null
}
export type WordWrite = {
  action: 'install' | 'remove' | 'guess' | 'share' | 'withdraw'
  body: object
}
export type WordWriteResult = {
  receipt: WordReceipt | null
  failure: { status: number; code: string; message: string } | null
}
export type WordResults = {
  clock: WordClock
  results: { date: string; ownerId: number; name: string; attempts: number; solved: boolean }[]
}
export const WORD_PATH = '/my-space?view=widgets&tool=word'
export const WORD_RESULTS_PATH = '/my-space?view=family&tool=word-results'
