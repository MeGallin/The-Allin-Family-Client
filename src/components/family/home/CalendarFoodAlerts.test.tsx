import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CalendarFoodAlerts } from './CalendarFoodAlerts'
import type { FoodAlertsFeed } from '../../../features/food-alerts/types'

const state = vi.hoisted(() => ({
  data: undefined as FoodAlertsFeed | undefined,
  isLoading: false,
  isError: false,
}))
vi.mock('../../../features/food-alerts/useFoodAlerts', () => ({ useFoodAlerts: () => state }))
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.parse('2026-10-23T12:00:00Z') }))
const show = () =>
  render(
    <MemoryRouter initialEntries={['/?days=45']}>
      <CalendarFoodAlerts />
    </MemoryRouter>,
  )

describe('calendar food alert indicator', () => {
  beforeEach(() => {
    state.isLoading = false
    state.isError = false
    state.data = {
      status: 'ready',
      updatedAt: '2026-10-23T11:55:00Z',
      data: [
        {
          id: '1',
          title: 'Older allergy notice',
          publishedAt: '2026-10-21',
          kind: 'allergy',
          url: 'https://alerts.food.gov.uk/a',
        },
        {
          id: '2',
          title: 'Recall notice',
          publishedAt: '2026-10-20',
          kind: 'recall',
          url: 'https://alerts.food.gov.uk/b',
        },
      ],
    }
  })
  it('highlights notice types and offers a dialog without navigation', () => {
    show()
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain(
      '1 allergy alert · 1 recall',
    )
    expect(screen.getByText('2')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /Latest food alerts/ }).getAttribute('aria-haspopup'),
    ).toBe('dialog')
    expect(screen.queryByText(/today/i)).toBeNull()
  })
  it('does not invent an alert while loading', () => {
    state.isLoading = true
    state.data = undefined
    show()
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('hides the indicator for a successfully empty feed', () => {
    state.data!.data = []
    show()
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('keeps access to official advice when the feed is unavailable', () => {
    state.data = { status: 'unavailable', updatedAt: null, data: null }
    show()
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('updates unavailable')
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain(
      'Check the latest FSA advice',
    )
  })
  it('labels stale notices and expires counts using the same rules as the full list', () => {
    state.data!.status = 'stale'
    const view = show()
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain(
      '1 allergy alert · 1 recall · updates delayed',
    )
    state.data!.updatedAt = '2026-10-22T00:00:00Z'
    view.rerender(
      <MemoryRouter>
        <CalendarFoodAlerts />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button').getAttribute('aria-label')).not.toContain('1 allergy')
  })
})
