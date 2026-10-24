import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { FamilyWidget } from '../../../features/widgets/types'
import { HomeDinnerSummary } from './HomeDinnerSummary'
const state = vi.hoisted(() => ({
  widgets: [] as FamilyWidget[],
  error: '',
  refresh: vi.fn(),
  removals: {} as Record<string, unknown>,
}))
vi.mock('../../../features/widgets/useWidgets', () => ({
  useWidgets: () => ({ ...state, ownerId: 1, loading: false }),
}))
vi.mock('../../../hooks/useNow', () => ({ useNow: () => new Date(2026, 9, 24, 12).getTime() }))
const widget = (id: string, overrides: Partial<FamilyWidget> = {}): FamilyWidget => ({
  id,
  kind: 'dinner-spinner',
  title: 'Family wheel ' + id,
  visibility: 'family',
  owner: { id: 1, name: 'Dad' },
  version: 1,
  hidden: false,
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:00:00Z',
  meals: [],
  spins: [
    {
      id: 'trial',
      widgetId: id,
      mealId: '2',
      mealVersion: 1,
      meal: 'Never show my private pick',
      actor: { id: 1, name: 'Dad' },
      occurredAt: '2026-10-24T11:00:00Z',
    },
  ],
  publications: [
    {
      id: 'p' + id,
      spinId: 'published-trial',
      meal: 'Published pasta ' + id,
      forDate: '2026-10-24',
      mealType: 'dinner',
      current: true,
      eatenAt: null,
      eatenBy: null,
      publishedAt: '2026-10-24T10:00:00Z',
      publisher: { id: 1, name: 'Dad' },
      members: [
        { id: 1, name: 'Dad', active: true, choice: null, version: 0, respondedAt: null },
        {
          id: 2,
          name: 'Member',
          active: true,
          choice: 'agree',
          version: 1,
          respondedAt: '2026-10-24T10:01:00Z',
        },
        {
          id: 3,
          name: 'Inactive',
          active: false,
          choice: 'agree',
          version: 1,
          respondedAt: '2026-10-24T10:01:00Z',
        },
      ],
    },
  ],
  ...overrides,
})
const show = () =>
  render(
    <MemoryRouter>
      <HomeDinnerSummary />
    </MemoryRouter>,
  )
beforeEach(() => {
  state.widgets = []
  state.error = ''
  state.removals = {}
})
describe('Home published dinners', () => {
  it('shows only the published choice, actual active-member counts and the exact source link', () => {
    state.widgets = [widget('42')]
    show()
    const link = screen.getByRole('link', { name: /^Today/ })
    expect(link.getAttribute('href')).toBe('/my-space?view=family&widget=42&meal=p42')
    expect(link.textContent).toContain('Published pasta 42')
    expect(link.textContent).toContain('1 of 2 happy')
    expect(link.textContent).toContain('1 not replied')
    expect(screen.queryByText('Never show my private pick')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Happy with that' })).toBeNull()
  })
  it('omits personal, hidden, removed and unpublished choices, keeping past meals in the diary', () => {
    const past = widget('past')
    past.publications[0].forDate = '2026-10-23'
    state.widgets = [
      widget('private', { visibility: 'private' }),
      widget('hidden', { hidden: true }),
      widget('removed'),
      widget('trial', { publications: [] }),
      past,
    ]
    state.removals = { removed: {} }
    const { container } = show()
    expect(screen.queryByText('Published pasta private')).toBeNull()
    expect(screen.queryByText('Published pasta hidden')).toBeNull()
    expect(screen.queryByText('Published pasta removed')).toBeNull()
    expect(container.textContent).toContain('Seven-day meal diary')
  })
  it('updates the result and response counts from the shared query without another spin', () => {
    state.widgets = [widget('1')]
    const view = show()
    state.widgets[0].publications[0].meal = 'Replacement curry'
    state.widgets[0].publications[0].members[0].choice = 'another'
    view.rerender(
      <MemoryRouter>
        <HomeDinnerSummary />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /^Today/ }).textContent).toContain('Replacement curry')
    expect(screen.getByRole('link', { name: /^Today/ }).textContent).toContain('1 suggest another')
    expect(screen.queryByText('View & respond')).toBeNull()
  })
  it('sorts future dinners by date and retries failed reads', () => {
    const future = widget('future')
    future.publications[0].forDate = '2026-10-26'
    state.widgets = [future, widget('today')]
    state.error = 'Connection interrupted'
    show()
    expect(screen.getAllByRole('link')[0].textContent).toContain('Published pasta today')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.refresh).toHaveBeenCalledOnce()
  })
  it('shows the no-response default without turning missing replies into agreement', () => {
    const saved = widget('default')
    saved.publications[0].members.forEach((member) => (member.choice = null))
    state.widgets = [saved]
    show()
    const link = screen.getByRole('link', { name: /^Today/ })
    expect(link.textContent).toContain('Chosen by default')
    expect(link.textContent).toContain('Replies optional')
    expect(link.textContent).not.toContain('happy')
    expect(saved.publications[0].members.every((member) => member.choice === null)).toBe(true)
  })
  it('shows completed meals as logged rather than asking for replies', () => {
    const saved = widget('eaten')
    saved.publications[0].eatenAt = '2026-10-24T11:30:00Z'
    saved.publications[0].eatenBy = { id: 1, name: 'Dad' }
    state.widgets = [saved]
    show()
    const link = screen.getByRole('link', { name: /^Today/ })
    expect(link.textContent).toContain('Recorded as eaten')
    expect(link.textContent).toContain('Meal logged in the seven-day diary')
    expect(link.textContent).toContain('View diary')
    expect(link.textContent).not.toContain('View & respond')
  })
})
