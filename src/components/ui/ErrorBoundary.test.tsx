import { lazy, Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary, ErrorRecovery } from './ErrorBoundary'

describe('family recovery view', () => {
  it('handles a rejected lazy route without exposing exception details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const FailedPage = lazy(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module: /private/chunk.js')),
    )
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <Suspense fallback={<p>Loading</p>}>
              <FailedPage />
            </Suspense>
          ),
          errorElement: <ErrorRecovery />,
        },
      ],
      { initialEntries: ['/admin'] },
    )
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'Let’s try that again.' })).toBeTruthy()
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Let’s try that again.' }),
    )
    expect(screen.getByRole('alert').textContent).toBe(
      'This part of your family space could not be loaded.',
    )
    const reload = screen.getByRole('button', { name: 'Reload page' })
    reload.focus()
    expect(document.activeElement).toBe(reload)
    const home = screen.getByRole('link', { name: 'Home' })
    expect(home.getAttribute('href')).toBe('/')
    home.focus()
    expect(document.activeElement).toBe(home)
    expect(document.body.textContent).not.toMatch(
      /private|chunk.js|Unexpected Application Error|developer/i,
    )
  })
  it('reuses recovery for errors outside the router', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function FailedApp(): never {
      throw new Error('Sensitive internal diagnostic')
    }
    render(
      <ErrorBoundary>
        <FailedApp />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
    expect(document.body.textContent).not.toContain('Sensitive internal diagnostic')
  })
})
