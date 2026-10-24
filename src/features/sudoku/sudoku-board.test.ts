import { describe, expect, it } from 'vitest'
import { conflicts, enterDigit, moveCell, peers, progressOf, sameProgress } from './sudoku-board'
import { sudokuGame } from '../../test/sudoku-fixtures'
describe('Sudoku local board transformations', () => {
  it('never edits clues and treats note toggles/clear as immutable reversible progress', () => {
    const game = sudokuGame(),
      base = progressOf(game)
    expect(enterDigit(base, game.givens, 2, 9, false)).toBe(base)
    const note = enterDigit(base, game.givens, 0, 9, true)
    expect(note.notes[0]).toBe(256)
    expect(base.notes[0]).toBe(0)
    expect(sameProgress(enterDigit(note, game.givens, 0, 9, true), base)).toBe(true)
    const value = enterDigit(note, game.givens, 0, 1, false)
    expect(value.entries[0]).toBe('1')
    expect(value.notes[0]).toBe(0)
    expect(sameProgress(enterDigit(value, game.givens, 0, 0, false), base)).toBe(true)
    expect(enterDigit({ ...base, paused: true }, game.givens, 0, 1, false).entries).toBe(
      base.entries,
    )
  })
  it('finds duplicate peers in rows/columns/boxes without treating unrelated equal digits as conflicts', () => {
    expect(peers(0, 8)).toBe(true)
    expect(peers(0, 72)).toBe(true)
    expect(peers(0, 10)).toBe(true)
    expect(peers(0, 40)).toBe(false)
    let value = '0'.repeat(81).split('')
    value[0] = '5'
    value[40] = '5'
    expect(conflicts(value.join('')).size).toBe(0)
    value[1] = '5'
    expect([...conflicts(value.join(''))]).toEqual([0, 1])
  })
  it('bounds arrow navigation and supports row/global Home/End', () => {
    expect(moveCell(0, 'ArrowLeft', false)).toBe(0)
    expect(moveCell(80, 'ArrowDown', false)).toBe(80)
    expect(moveCell(13, 'Home', false)).toBe(9)
    expect(moveCell(13, 'End', false)).toBe(17)
    expect(moveCell(13, 'Home', true)).toBe(0)
    expect(moveCell(13, 'End', true)).toBe(80)
  })
})
