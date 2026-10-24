import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import type { DinnerPublication, FamilyWidget } from '../../features/widgets/types'
import { PublishedDinner } from './PublishedDinner'
const actions = vi.hoisted(() => ({ respond: vi.fn(), recordEaten: vi.fn() }))
vi.mock('../../features/widgets/useWidgets', () => ({
  useWidgets: () => ({ ownerId: 1, pending: false, ...actions }),
}))
vi.mock('../../hooks/useNow', () => ({ useNow: () => new Date(2026, 9, 24, 12).getTime() }))
const publication = (
  id: string,
  mealType: 'lunch' | 'dinner',
  eaten = false,
): DinnerPublication => ({
  id,
  mealType,
  meal: mealType === 'lunch' ? 'Soup' : 'Pasta',
  spinId: id,
  forDate: '2026-10-24',
  current: true,
  eatenAt: eaten ? '2026-10-24T11:00:00Z' : null,
  eatenBy: eaten ? { id: 1, name: 'Dad' } : null,
  publishedAt: '2026-10-24T10:00:00Z',
  publisher: { id: 1, name: 'Dad' },
  members: [{ id: 1, name: 'Dad', active: true, choice: null, version: 0, respondedAt: null }],
})
const widget = (eaten = false): FamilyWidget => ({
  id: '1',
  kind: 'dinner-spinner',
  title: 'Family meals',
  owner: { id: 1, name: 'Dad' },
  visibility: 'family',
  version: 3,
  hidden: false,
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:00:00Z',
  meals: [],
  spins: [],
  publications: [publication('2', 'dinner'), publication('1', 'lunch', eaten)],
})
beforeEach(() => vi.clearAllMocks())
describe('Published lunch and dinner controls', () => {
  it('selects an exact lunch deep link and switches to dinner without replacing lunch', () => {
    render(
      <MemoryRouter initialEntries={['/my-space?view=family&widget=1&meal=1']}>
        <PublishedDinner widget={widget()} disabled={false} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Soup' })).toBeTruthy()
    expect(
      screen.getByText('Chosen by default', { selector: '.published-dinner__status' }),
    ).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Published meal'), { target: { value: '2' } })
    expect(screen.getByRole('heading', { name: 'Pasta' })).toBeTruthy()
    expect(actions.respond).not.toHaveBeenCalled()
  })
  it('locks both response buttons for an eaten meal and offers the correct correction action', () => {
    const saved = widget(true)
    render(
      <MemoryRouter initialEntries={['/my-space?view=family&widget=1&meal=1']}>
        <PublishedDinner widget={saved} disabled={false} />
      </MemoryRouter>,
    )
    expect(
      (screen.getByRole('button', { name: 'Happy with that' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Suggest another' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      screen.getByText('Recorded as eaten', { selector: '.published-dinner__status' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Correct eaten record' }))
    expect(actions.recordEaten).toHaveBeenCalledWith(saved, saved.publications[1], false)
    expect(actions.respond).not.toHaveBeenCalled()
  })
  it('requires review for a missing or replaced meal instead of silently accepting replies on another', () => {
    render(
      <MemoryRouter initialEntries={['/my-space?view=family&widget=1&meal=999']}>
        <PublishedDinner widget={widget()} disabled={false} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'This meal choice has changed' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Happy with that' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show current meal' }))
    expect(screen.getByRole('button', { name: 'Happy with that' })).toBeTruthy()
    expect(actions.respond).not.toHaveBeenCalled()
  })
})
