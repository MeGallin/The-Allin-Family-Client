import { lazy, Suspense, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DraftProtectionProvider, useDraftGuard } from '../../features/drafts/DraftProtection'
import { PageErrorBoundary } from './PageErrorBoundary'

describe('page failure lifetime', () => {
  it('preserves a healthy mounted draft through filter and query navigation', async () => {
    function Editor() {
      const [text, setText] = useState('')
      useDraftGuard(!!text)
      return (
        <input
          aria-label="Synthetic draft"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      )
    }
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <DraftProtectionProvider>
              <PageErrorBoundary>
                <Editor />
              </PageErrorBoundary>
            </DraftProtectionProvider>
          ),
        },
      ],
      { initialEntries: ['/calendar?compose=event'] },
    )
    render(<RouterProvider router={router} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Keep my draft' } })
    await act(() => router.navigate('/calendar?compose=event&q=plan&sort=name'))
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input.value).toBe('Keep my draft')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('preserves persistent draft guards and blocks SPA Home until explicit discard', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const FailedPage = lazy(() => Promise.reject(new Error('Synthetic failed lazy module')))
    function PersistentOwner() {
      useDraftGuard(true)
      return <p>Persistent unsaved owner</p>
    }
    const router = createMemoryRouter(
      [
        {
          element: (
            <DraftProtectionProvider>
              <PersistentOwner />
              <PageErrorBoundary>
                <Suspense fallback="Loading">
                  <Outlet />
                </Suspense>
              </PageErrorBoundary>
            </DraftProtectionProvider>
          ),
          children: [
            { path: '/broken', element: <FailedPage /> },
            { path: '/', element: <p>Recovered Home</p> },
          ],
        },
      ],
      { initialEntries: ['/broken'] },
    )
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: 'Let’s try that again.' })
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })).toBeTruthy()
    expect(router.state.location.pathname).toBe('/broken')
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByText('Persistent unsaved owner')).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard changes' }))
    expect(await screen.findByText('Recovered Home')).toBeTruthy()
  })
})
