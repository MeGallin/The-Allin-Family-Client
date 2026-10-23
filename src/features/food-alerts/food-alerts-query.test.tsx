import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router'
import { createAppStore } from '../../app/store'
import { foodAlertsApi } from '../../services/food-alerts-query'
import { jsonResponse } from '../../test/fixtures'
import { CalendarFoodAlerts } from '../../components/family/home/CalendarFoodAlerts'
function Location() {
  const location = useLocation()
  return <output data-testid="route">{location.pathname + location.search}</output>
}

describe('shared food alert subscriptions', () => {
  it('opens and closes the calendar dialog without navigation or another request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          status: 'ready',
          updatedAt: new Date().toISOString(),
          data: [
            {
              id: 'FSA-PRIN-1-2026',
              kind: 'recall',
              title: 'Example recall for shared query',
              publishedAt: '2026-10-21',
              url: 'https://alerts.food.gov.uk/a',
            },
          ],
        }),
      ),
    )
    const store = createAppStore()
    const view = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/?days=45']}>
          <CalendarFoodAlerts />
          <Location />
        </MemoryRouter>
      </Provider>,
    )
    try {
      expect(await screen.findByRole('button', { name: /Latest food alerts/ })).toBeTruthy()
      expect(screen.queryByRole('region', { name: 'Food alerts' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: /Latest food alerts/ }))
      expect(await screen.findByRole('dialog', { name: 'Latest food alerts' })).toBeTruthy()
      const title = await screen.findByText(
        'Example recall for shared query',
        {},
        { timeout: 10000 },
      )
      fireEvent.click(title)
      expect(screen.getByRole('link', { name: /Read the official FSA notice/ })).toBeTruthy()
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('route').textContent).toBe('/?days=45')
      expect(screen.getByRole('region', { name: 'Food alerts' }).id).toBe('food-alerts')
      expect(screen.getByRole('region', { name: 'Food alerts' }).tabIndex).toBe(-1)
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.body.style.overflow).not.toBe('hidden')
    } finally {
      view.unmount()
      store.dispatch(foodAlertsApi.util.resetApiState())
    }
  }, 15000)
})
