import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router'
import { createAppStore } from '../../app/store'
import { foodAlertsApi } from '../../services/food-alerts-query'
import { jsonResponse } from '../../test/fixtures'
import { CalendarFoodAlerts } from '../../components/family/home/CalendarFoodAlerts'
import AlertsPage from '../../pages/family/AlertsPage'

describe('shared food alert subscriptions', () => {
  it('navigates from the calendar badge to Alerts without another request or Home details', async () => {
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
          <Routes>
            <Route path="/" element={<CalendarFoodAlerts />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    )
    try {
      expect(await screen.findByRole('link', { name: /Latest food alerts/ })).toBeTruthy()
      expect(screen.queryByRole('region', { name: 'Food alerts' })).toBeNull()
      fireEvent.click(screen.getByRole('link', { name: /Latest food alerts/ }))
      expect(await screen.findByRole('heading', { name: 'Alerts' })).toBeTruthy()
      const title = await screen.findByText('Example recall for shared query')
      fireEvent.click(title)
      expect(screen.getByRole('link', { name: /Read the official FSA notice/ })).toBeTruthy()
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('region', { name: 'Food alerts' }).id).toBe('food-alerts')
      expect(screen.getByRole('region', { name: 'Food alerts' }).tabIndex).toBe(-1)
    } finally {
      view.unmount()
      store.dispatch(foodAlertsApi.util.resetApiState())
    }
  })
})
