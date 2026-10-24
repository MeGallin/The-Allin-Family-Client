import { useState, type Dispatch, type SetStateAction } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Link, createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import type { useSudoku } from '../../features/sudoku/useSudoku'
import type { SudokuGame, SudokuSnapshot } from '../../features/sudoku/types'
import { SudokuBoard } from './SudokuBoard'
import { sudokuGame, savedSudoku } from '../../test/sudoku-fixtures'
import { deferred } from '../../test/fixtures'
type Controller = ReturnType<typeof useSudoku>
function mount(overrides: Partial<Controller> = {}, initial = sudokuGame()) {
  let setController: Dispatch<SetStateAction<Controller>>
  const onExit = vi.fn(),
    controller: Controller = {
      ownerId: 101,
      installationVersion: 1,
      game: initial,
      known: true,
      pending: false,
      feedback: '',
      loading: false,
      offline: false,
      failure: undefined,
      error: '',
      clearError: vi.fn(),
      refresh: vi.fn(),
      install: vi.fn(),
      newGame: vi.fn(async () => null),
      restart: vi.fn(async () => null),
      removals: {},
      remove: vi.fn(() => false),
      undoRemove: vi.fn(),
      save: vi.fn(async (game, progress) => {
        const saved = savedSudoku(game, progress)
        setController((current) => ({ ...current, game: saved }))
        return { ownerId: 101, installationVersion: saved.version, game: saved }
      }),
      ...overrides,
    }
  function Harness() {
    const [current, update] = useState(controller)
    setController = update
    return (
      <DraftProtectionProvider>
        <SudokuBoard initial={initial} sudoku={current} onExit={onExit} />
        <Link to="/elsewhere">Leave game</Link>
      </DraftProtectionProvider>
    )
  }
  const router = createMemoryRouter([{ path: '*', element: <Harness /> }], {
    initialEntries: ['/my-space?view=widgets&tool=sudoku'],
  })
  render(<RouterProvider router={router} />)
  return {
    controller,
    onExit,
    router,
    update: (values: Partial<Controller>) =>
      act(() => setController((current) => ({ ...current, ...values }))),
  }
}
const cell = (row = 1, column = 1) =>
  within(screen.getByRole('grid')).getByRole('button', {
    name: new RegExp(`^Row ${row}, column ${column},`),
  })
const type = (value: string, target = cell()) => {
  target.focus()
  fireEvent.keyDown(target, { key: value })
}
describe('Sudoku board editing, saving and guarded navigation', () => {
  it('has one grid Tab stop, immutable clues and roving keyboard navigation', () => {
    mount()
    const buttons = within(screen.getByRole('grid')).getAllByRole('button')
    expect(buttons).toHaveLength(81)
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1)
    type('ArrowRight')
    expect(document.activeElement).toBe(cell(1, 2))
    fireEvent.keyDown(cell(1, 2), { key: 'End', ctrlKey: true })
    expect(document.activeElement).toBe(cell(9, 9))
    const given = cell(1, 3)
    type('9', given)
    expect(given.getAttribute('aria-label')).toContain('clue 3')
    expect(
      (screen.getByRole('button', { name: 'Save progress' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
  it('edits pencil marks, Undo/Redo and clear and reports conflicts without changing clues', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Pencil' }))
    type('2')
    expect(cell().getAttribute('aria-label')).toContain('pencil 2')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(cell().getAttribute('aria-label')).toContain('empty')
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(cell().getAttribute('aria-label')).toContain('pencil 2')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(cell().getAttribute('aria-label')).toContain('empty')
    fireEvent.click(screen.getByRole('button', { name: 'Pencil' }))
    type('9')
    expect(cell().getAttribute('aria-label')).toContain('conflict')
    expect(screen.getByText(/cells have a row, column or box conflict/)).not.toBeNull()
    expect(cell(1, 9).getAttribute('aria-label')).toContain('clue 9')
  })
  it('protects a dirty route, keeps edits after Keep, then permits leaving after explicit Save', async () => {
    const { controller, router } = mount()
    type('1')
    fireEvent.click(screen.getByRole('link', { name: 'Leave game' }))
    expect(screen.getByRole('dialog', { name: 'Discard unsaved changes?' })).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(cell().getAttribute('aria-label')).toContain('1')
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Save progress' }) as HTMLButtonElement).disabled,
      ).toBe(true),
    )
    expect(controller.save).toHaveBeenCalledOnce()
    expect(screen.getByText('Saved.')).not.toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Leave game' }))
    expect(router.state.location.pathname).toBe('/elsewhere')
  })
  it('retains busy-grid focus, blocks edits, preserves an uncertain failure and reuses its exact retry key', async () => {
    const pending = deferred<SudokuSnapshot | null>(),
      save = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(null)
    const { update } = mount({ save })
    type('1')
    const selected = cell()
    fireEvent.keyDown(selected, { key: 's', ctrlKey: true })
    update({ pending: true })
    expect(document.activeElement).toBe(selected)
    expect(selected.getAttribute('aria-disabled')).toBe('true')
    fireEvent.keyDown(selected, { key: '2' })
    expect(selected.getAttribute('aria-label')).toContain(', 1')
    await act(async () => pending.resolve(null))
    update({
      pending: false,
      error: 'Request timed out',
      failure: { status: 0, code: 'timeout', message: 'Request timed out' },
    })
    expect(document.activeElement).toBe(selected)
    expect(screen.getByRole('alert').textContent).toContain('local board is kept')
    fireEvent.keyDown(selected, { key: 's', ctrlKey: true })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    expect(save.mock.calls[1]).toEqual(save.mock.calls[0])
    fireEvent.keyDown(selected, { key: '2' })
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(3))
    expect(save.mock.calls[2][2]).not.toBe(save.mock.calls[0][2])
  })
  it('preserves dirty progress on a newer version until explicit confirmed reload', () => {
    const { update } = mount()
    type('1')
    update({
      game: { ...sudokuGame(), version: 2 },
      error: 'Your game changed',
      failure: { status: 409, code: 'sudoku_conflict', message: 'Your game changed' },
    })
    expect(cell().getAttribute('aria-label')).toContain(', 1')
    expect(
      (screen.getByRole('button', { name: 'Save progress' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Load latest · discard local changes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep current game' }))
    expect(cell().getAttribute('aria-label')).toContain(', 1')
    fireEvent.click(screen.getByRole('button', { name: 'Load latest · discard local changes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard local and load latest' }))
    expect(cell().getAttribute('aria-label')).toContain('empty')
    expect(
      screen.queryByText('This game changed in another window. Your local board is kept.'),
    ).toBeNull()
  })
  it('persists pause on Save and shows completion feedback for a valid final entry', async () => {
    const initial = sudokuGame([0]),
      { controller } = mount({}, initial)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.queryByRole('grid')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
    await waitFor(() => expect(controller.save).toHaveBeenCalledOnce())
    expect(vi.mocked(controller.save).mock.calls[0][1].paused).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    type('1')
    expect(screen.getByText('Puzzle complete \u2014 save to record your finish.')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
    await waitFor(() => expect(screen.getByText('Saved \u00b7 Puzzle completed.')).not.toBeNull())
  })
  it('hides an old save success after a new edit without hiding errors', async () => {
    const { update } = mount()
    type('1')
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
    await waitFor(() => expect(screen.getByText('Saved.')).not.toBeNull())
    update({ feedback: 'Your Sudoku progress is saved.' })
    expect(screen.getByText('Saved. Your Sudoku progress is saved.')).not.toBeNull()
    type('2')
    update({ error: 'Connection unavailable' })
    expect(screen.getByText('Unsaved changes \u2014 use Save progress.')).not.toBeNull()
    expect(screen.queryByText(/Your Sudoku progress is saved/)).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain('Connection unavailable')
  })
  it('shows a recorded finish after refresh and clears it when the board changes', () => {
    const initial = sudokuGame([0])
    initial.entries = '1' + initial.entries.slice(1)
    initial.completedAt = '2026-10-24T20:00:00Z'
    mount({ feedback: 'Puzzle completed. Your progress is saved.' }, initial)
    expect(screen.getByText('Saved \u00b7 Puzzle completed.')).not.toBeNull()
    expect(screen.getByText('Your finish is saved.')).not.toBeNull()
    expect(screen.queryByText('Puzzle complete \u2014 save to record your finish.')).toBeNull()
    type('Delete')
    expect(screen.queryByText('Your finish is saved.')).toBeNull()
    expect(screen.getByText('Unsaved changes \u2014 use Save progress.')).not.toBeNull()
    type('1')
    expect(screen.getByText('Your finish is saved.')).not.toBeNull()
  })
  it('confirms new/restart and keeps the current board when replacement fails', async () => {
    const newGame = vi.fn<Controller['newGame']>(async () => null),
      restart = vi.fn<Controller['restart']>(async () => null),
      { update } = mount({ newGame, restart })
    type('1')
    fireEvent.click(screen.getByRole('button', { name: 'New puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep current game' }))
    expect(newGame).not.toHaveBeenCalled()
    expect(cell().getAttribute('aria-label')).toContain(', 1')
    fireEvent.click(screen.getByRole('button', { name: 'Restart puzzle' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Restart puzzle',
      }),
    )
    await waitFor(() => expect(restart).toHaveBeenCalledOnce())
    update({ error: 'A new puzzle could not be prepared' })
    expect(within(screen.getByRole('dialog')).getByRole('alert').textContent).toContain('could not')
    expect(cell().getAttribute('aria-label')).toContain(', 1')
    fireEvent.click(screen.getByRole('button', { name: 'Keep current game' }))
    fireEvent.click(screen.getByRole('button', { name: 'New puzzle' }))
    fireEvent.change(within(screen.getByRole('dialog')).getByRole('combobox'), {
      target: { value: 'hard' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start new puzzle' }))
    await waitFor(() => expect(newGame).toHaveBeenCalledOnce())
    expect(newGame.mock.calls[0][1]).toBe('hard')
  })
  it('schedules removal through the shared confirmation and preserves the current revision', () => {
    const remove = vi.fn(() => true),
      { onExit } = mount({ remove })
    fireEvent.click(screen.getByRole('button', { name: 'Remove Sudoku' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Sudoku installation' }))
    expect(remove).toHaveBeenCalledWith(sudokuGame())
    expect(onExit).toHaveBeenCalledOnce()
  })
})
