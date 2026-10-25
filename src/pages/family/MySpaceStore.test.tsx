import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { FamilyWidget } from '../../features/widgets/types'
import MySpacePage from './MySpacePage'
const snapshot = vi.hoisted(() => ({
  widgets: [] as FamilyWidget[],
  removals: {} as Record<string, unknown>,
}))
vi.mock('../../features/widgets/useWidgets', () => ({
  useWidgets: () => ({
    ...snapshot,
    ownerId: 1,
    loading: false,
    pending: false,
    feedback: '',
    error: '',
    clearError: vi.fn(),
    refresh: vi.fn(),
    remove: vi.fn(),
    mealRemoval: { remove: vi.fn() },
  }),
}))
vi.mock('../../features/sudoku/useSudoku', () => ({
  useSudoku: () => ({
    game: null,
    installationVersion: 0,
    known: true,
    pending: false,
    loading: false,
    error: '',
    offline: false,
    removals: {},
    clearError: vi.fn(),
    refresh: vi.fn(),
  }),
}))
vi.mock('../../features/daily-word/useDailyWord', () => ({
  useDailyWord: () => ({
    installed: false,
    known: true,
    pending: false,
    loading: false,
    error: '',
    offline: false,
    removals: {},
    clearError: vi.fn(),
    refresh: vi.fn(),
  }),
}))
vi.mock('../../features/focus-timer/useFocusTimer', () => ({
  useFocusTimer: () => ({
    installed: false,
    known: true,
    pending: false,
    loading: false,
    error: '',
    offline: false,
    removals: {},
    clearError: vi.fn(),
    refresh: vi.fn(),
  }),
}))
// These established working views are outside the catalogue route contract being isolated here.
vi.mock('../../components/widgets/WidgetShelf', () => ({
  WidgetShelf: ({ scope, builtin }: { scope: string; builtin?: { id: string } }) => (
    <p>Existing shelf: {builtin?.id ?? scope}</p>
  ),
}))
vi.mock('../../components/widgets/WidgetComposer', () => ({
  default: ({ onSaved }: { onSaved: () => void }) => (
    <button onClick={onSaved}>Existing composer saved</button>
  ),
}))
function mount() {
  const router = createMemoryRouter(
    [{ path: '/my-space', element: <MySpacePage onSessionExpired={vi.fn()} /> }],
    { initialEntries: ['/my-space?view=library'] },
  )
  render(<RouterProvider router={router} />)
  return router
}
beforeEach(() => {
  snapshot.widgets = []
  snapshot.removals = {}
})
describe('Widget Store integration with existing page routes', () => {
  it('hands Install to the existing composer and retains its saved My widgets destination', async () => {
    const router = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Install Dinner Spinner' }))
    expect(new URLSearchParams(router.state.location.search).get('compose')).toBe('spinner')
    fireEvent.click(await screen.findByRole('button', { name: 'Existing composer saved' }))
    expect(new URLSearchParams(router.state.location.search).get('view')).toBe('widgets')
    expect(new URLSearchParams(router.state.location.search).has('compose')).toBe(false)
    expect(screen.getByText('Existing shelf: mine')).not.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('opens an installed built-in in the existing Family shelf', () => {
    const router = mount()
    fireEvent.click(screen.getByRole('link', { name: 'Open Shopping List' }))
    expect(router.state.location.search).toBe('?view=family&tool=shopping')
    expect(screen.getByText('Existing shelf: shopping')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Shopping List', level: 1 })).not.toBeNull()
  })
  it('excludes a queued removal from actual installed status without mutating the snapshot', () => {
    snapshot.widgets = [
      {
        id: 'queued',
        kind: 'dinner-spinner',
        title: 'Queued setup',
        visibility: 'family',
        owner: { id: 1, name: 'Dad' },
        version: 1,
        hidden: false,
        createdAt: '',
        updatedAt: '',
        meals: [],
        spins: [],
        publications: [],
      },
    ]
    snapshot.removals = { queued: { id: 'queued' } }
    mount()
    expect(screen.getByText('Available · Personal or family')).not.toBeNull()
    expect(screen.queryByRole('link', { name: 'Open Dinner Spinner' })).toBeNull()
    expect(snapshot.widgets).toHaveLength(1)
  })
})
