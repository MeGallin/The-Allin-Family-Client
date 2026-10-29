import { fireEvent, render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { testUser } from '../../test/fixtures'
import { FamilyLayout } from './FamilyLayout'

beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()))

function mount() {
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <Routes>
          <Route
            element={
              <FamilyLayout
                user={{ ...testUser, role: 'admin' }}
                onChangePassword={vi.fn()}
                onLogout={vi.fn()}
                loggingOut={false}
                error=""
              />
            }
          >
            <Route index element={<h1>Home page</h1>} />
            <Route path="calendar" element={<h1>Calendar page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('collapsible desktop navigation', () => {
  it('starts collapsed and keeps labelled links and collapse state while navigating', async () => {
    mount()
    const toggle = screen.getByRole('button', { name: 'Expand navigation' })
    const controlled = document.getElementById(toggle.getAttribute('aria-controls')!)
    expect(controlled).toBeTruthy()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(toggle)
    const collapse = screen.getByRole('button', { name: 'Collapse navigation' })
    expect(collapse.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(collapse)
    const expand = screen.getByRole('button', { name: 'Expand navigation' })
    expect(expand.getAttribute('aria-expanded')).toBe('false')
    const navigation = within(screen.getByRole('navigation', { name: 'Family navigation' }))
    expect(
      navigation.getByRole('link', { name: 'Owner’s Personal Notes' }).getAttribute('href'),
    ).toBe('/notes')
    expect(within(controlled!).getByRole('link', { name: 'Administration' })).toBeTruthy()

    fireEvent.click(navigation.getByRole('link', { name: 'Calendar' }))
    await screen.findByRole('heading', { name: 'Calendar page' })
    expect(
      screen.getByRole('button', { name: 'Expand navigation' }).getAttribute('aria-expanded'),
    ).toBe('false')

    fireEvent.click(expand)
    expect(
      screen.getByRole('button', { name: 'Collapse navigation' }).getAttribute('aria-expanded'),
    ).toBe('true')
  })
})
