import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { FoodAlerts } from './FoodAlerts'
import type { FoodAlertsFeed } from '../../../features/food-alerts/types'

const state = vi.hoisted(() => ({
  data: undefined as FoodAlertsFeed | undefined,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
}))
vi.mock('../../../features/food-alerts/useFoodAlerts', () => ({ useFoodAlerts: () => state }))
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.parse('2026-10-23T12:00:00Z') }))

describe('Alerts page food notices', () => {
  beforeEach(() => {
    state.data = {
      status: 'ready',
      updatedAt: '2026-10-23T11:55:00Z',
      data: [
        {
          id: 'FSA-AA-1-2026',
          title: 'Example product recalled for undeclared milk',
          publishedAt: '2026-10-21',
          kind: 'allergy',
          url: 'https://alerts.food.gov.uk/news-alerts/alert/fsa-aa-1-2026',
          details: {
            products: [
              {
                name: 'Example snack',
                packSize: '100g',
                productCode: 'SNACK-1',
                batches: [{ batchCode: 'B123', bestBefore: 'All date codes', useBy: null }],
              },
            ],
            riskStatements: ['This product contains undeclared milk.'],
            consumerAdvice: 'Return the affected product to the shop for a refund.',
          },
        },
        {
          id: 'FSA-PRIN-2-2026',
          title: 'Example recall',
          publishedAt: '2026-10-20',
          kind: 'recall',
          url: 'https://alerts.food.gov.uk/news-alerts/alert/fsa-prin-2-2026',
        },
      ],
    }
    state.isLoading = false
    state.isError = false
    state.isFetching = false
    state.refetch.mockClear()
  })
  it('shows official links, notice types, publication dates and separate check time', () => {
    render(<FoodAlerts />)
    expect(screen.getByRole('region', { name: 'Food alerts' })).toBeTruthy()
    expect(screen.getByText('Allergy alert')).toBeTruthy()
    expect(screen.getByText('Recall')).toBeTruthy()
    expect(screen.getByText('21 Oct 2026').getAttribute('datetime')).toBe('2026-10-21')
    expect(screen.getByText(/Last checked/)).toBeTruthy()
    fireEvent.click(screen.getByText('Example product recalled for undeclared milk'))
    const link = screen.getByRole('link', { name: /Example product/ })
    expect(link.getAttribute('href')).toContain('https://alerts.food.gov.uk/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.getByRole('link', { name: /View all alerts/ }).getAttribute('href')).toBe(
      'https://www.food.gov.uk/news-alerts/search/alerts',
    )
  })
  it('expands and collapses products, batch details, risk and consumer advice inline', () => {
    render(<FoodAlerts />)
    const title = screen.getByText('Example product recalled for undeclared milk')
    const accordion = title.closest('details')!
    expect(accordion.open).toBe(false)
    fireEvent.click(title)
    expect(accordion.open).toBe(true)
    expect(
      within(accordion).getByRole('region', { name: 'Affected products' }).textContent,
    ).toContain('Example snack')
    expect(within(accordion).getByText('100g')).toBeTruthy()
    expect(within(accordion).getByText('SNACK-1')).toBeTruthy()
    expect(within(accordion).getByText('B123')).toBeTruthy()
    expect(within(accordion).getByText('All date codes')).toBeTruthy()
    expect(within(accordion).getByRole('region', { name: 'The risk' }).textContent).toContain(
      'undeclared milk',
    )
    expect(within(accordion).getByRole('region', { name: 'What to do' }).textContent).toContain(
      'refund',
    )
    fireEvent.click(title)
    expect(accordion.open).toBe(false)
  })
  it('provides explicit fallbacks and the official link when detail fields are missing', () => {
    render(<FoodAlerts />)
    const title = screen.getByText('Example recall')
    fireEvent.click(title)
    const accordion = title.closest('details')!
    expect(within(accordion).getByText(/Product details were not supplied/)).toBeTruthy()
    expect(within(accordion).getByText(/Risk details were not supplied/)).toBeTruthy()
    expect(within(accordion).getByText(/Consumer advice was not supplied/)).toBeTruthy()
    expect(
      within(accordion).getByRole('link', { name: /Read the official FSA notice/ }),
    ).toBeTruthy()
  })
  it('renders provider text as text rather than executable markup', () => {
    state.data!.data![0].details!.consumerAdvice = '<img src=x onerror=alert(1)>'
    const view = render(<FoodAlerts />)
    fireEvent.click(screen.getByText('Example product recalled for undeclared milk'))
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy()
    expect(view.container.querySelector('img')).toBeNull()
  })
  it('shows a loading state without claiming there are no alerts', () => {
    state.isLoading = true
    state.data = undefined
    render(<FoodAlerts />)
    expect(screen.getByRole('status').textContent).toContain('Checking')
    expect(screen.queryByText(/No notices/)).toBeNull()
  })
  it('offers recovery and the FSA link when unavailable', () => {
    state.data = { status: 'unavailable', updatedAt: null, data: null }
    render(<FoodAlerts />)
    expect(screen.getByRole('status').textContent).toContain('temporarily unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.refetch).toHaveBeenCalledOnce()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
  it('labels stale cached notices honestly', () => {
    state.data!.status = 'stale'
    const view = render(<FoodAlerts />)
    expect(screen.getByRole('status').textContent).toContain('last checked earlier')
    expect(view.container.querySelectorAll('.food-alerts__list > li')).toHaveLength(2)
    expect(screen.getByText(/updates delayed/)).toBeTruthy()
  })
  it('hides expired notices even if a disconnected browser retains Redux data', () => {
    state.data!.updatedAt = '2026-10-22T12:00:00Z'
    state.isError = true
    render(<FoodAlerts />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByRole('status').textContent).toContain('temporarily unavailable')
  })
  it('allows a fresh server timestamp ahead of the shared browser clock tick', () => {
    state.data!.updatedAt = '2026-10-23T12:00:15Z'
    const view = render(<FoodAlerts />)
    expect(view.container.querySelectorAll('.food-alerts__list > li')).toHaveLength(2)
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('distinguishes a successful empty feed from an outage', () => {
    state.data!.data = []
    render(<FoodAlerts />)
    expect(screen.getByText(/No notices returned/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })
})
