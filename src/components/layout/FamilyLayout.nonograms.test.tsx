import { fireEvent, render, screen, within } from '@testing-library/react'
import { lazy, useState } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../../features/auth/auth-slice'
import {
  nonogramOpened,
  nonogramEdited,
  nonogramWriteStarted,
  nonogramWriteFailed,
  nonogramWriteFinished,
} from '../../features/nonograms/nonograms-ui-slice'
import type { NonogramGame, NonogramWrite } from '../../features/nonograms/types'
import { nonogramApi } from '../../services/nonograms-query'
import { jsonResponse, testUser } from '../../test/fixtures'
import { PasswordForm } from '../auth/PasswordForm'
import { FamilyLayout } from './FamilyLayout'

const game: NonogramGame = {
  id: 'nonograms',
  title: 'Nonograms',
  puzzleId: 'sprout-5',
  name: 'Sprout',
  size: 5,
  rowClues: [[0]],
  columnClues: [[0]],
  cells: '0'.repeat(25),
  version: 1,
  assisted: false,
  completedAt: null,
  updatedAt: '',
  replay: false,
}
const write: NonogramWrite = { action: 'save', body: { version: 1, requestKey: 'pending' } }
const stores: ReturnType<typeof createAppStore>[] = []
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => jsonResponse({ error: 'Unavailable' }, 503)),
  )
})
afterEach(() => stores.splice(0).forEach((s) => clearPrivateState(s.dispatch)))

async function mount(
  kind: 'clean' | 'dirty' | 'failed' | 'uncertain' | 'busy',
  failedRoute = false,
) {
  const FailedPage = lazy(() => Promise.reject(new Error('Synthetic lazy page download failure')))
  const store = createAppStore()
  stores.push(store)
  store.dispatch(userReceived(testUser))
  await store.dispatch(
    nonogramApi.util.upsertQueryData('getNonogram', testUser.id, {
      ownerId: testUser.id,
      installationVersion: 1,
      game,
      played: [],
      catalogue: [],
    }),
  )
  store.dispatch(nonogramOpened({ ownerId: testUser.id, game }))
  if (kind !== 'clean') store.dispatch(nonogramEdited({ cells: '1' + '0'.repeat(24) }))
  if (['failed', 'uncertain', 'busy'].includes(kind)) {
    store.dispatch(nonogramWriteStarted(write))
    if (kind !== 'busy') {
      store.dispatch(
        nonogramWriteFailed({
          message: 'Save failed',
          uncertain: kind === 'uncertain',
          conflict: false,
        }),
      )
      store.dispatch(nonogramWriteFinished())
    }
  }
  const logout = vi.fn(() => clearPrivateState(store.dispatch))
  // Exercise the real layout and password form with App's conditional mount boundary.
  function Shell() {
    const [password, setPassword] = useState(false)
    return password ? (
      <>
        <button onClick={logout}>Sign out</button>
        <PasswordForm required={false} onCancel={() => setPassword(false)} onSession={vi.fn()} />
      </>
    ) : (
      <MemoryRouter initialEntries={[failedRoute ? '/broken' : '/']}>
        <Routes>
          <Route
            element={
              <FamilyLayout
                user={testUser}
                onChangePassword={() => setPassword(true)}
                onLogout={logout}
                loggingOut={false}
                error=""
              />
            }
          >
            <Route index element={<p>Family page</p>} />
            <Route path="broken" element={<FailedPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }
  render(
    <Provider store={store}>
      <Shell />
    </Provider>,
  )
  return { store, logout }
}
const account = () =>
  fireEvent.click(screen.getByLabelText('Account options for ' + testUser.familyName))
const unload = () => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('Nonograms account lifetime boundary', () => {
  it('retains uncertain puzzle recovery and unload protection through a failed page and SPA Home', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { store } = await mount('uncertain', true)
    const before = store.getState().nonogramUi
    await screen.findByRole('heading', { name: 'Let’s try that again.' })
    expect(screen.getByText(/Nonograms has unsaved marks/)).toBeTruthy()
    expect(unload()).toBe(true)
    fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Home' }))
    expect(await screen.findByText('Family page')).toBeTruthy()
    expect(store.getState().nonogramUi).toEqual(before)
    expect(unload()).toBe(true)
  })
  it.each(['dirty', 'failed', 'uncertain'] as const)(
    'keeps %s marks or explicitly discards before password settings',
    async (kind) => {
      const { store, logout } = await mount(kind)
      const before = store.getState().nonogramUi
      account()
      fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
      expect(screen.queryByRole('heading', { name: 'Change your password' })).toBeNull()
      expect(unload()).toBe(true)
      fireEvent.click(screen.getByRole('button', { name: 'Keep puzzle' }))
      expect(store.getState().nonogramUi).toEqual(before)
      account()
      fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
      fireEvent.click(screen.getByRole('button', { name: 'Discard and change password' }))
      expect(screen.getByRole('heading', { name: 'Change your password' })).toBeTruthy()
      expect(store.getState().nonogramUi.draft).toBeNull()
      expect(store.getState().nonogramUi.uncertain).toBeNull()
      expect(unload()).toBe(false)
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(store.getState().nonogramUi.draft).toBeNull()
      expect(store.getState().nonogramUi.uncertain).toBeNull()
      account()
      fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
      expect(logout).toHaveBeenCalledOnce()
    },
  )

  it('blocks busy discard and keeps the active request', async () => {
    const { store } = await mount('busy')
    account()
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    const dialog = screen.getByRole('dialog', { name: 'Unsaved puzzle marks' })
    const discard = within(dialog).getByRole('button', {
      name: 'Discard and change password',
    }) as HTMLButtonElement
    expect(discard.disabled).toBe(true)
    fireEvent.click(discard)
    expect(screen.queryByRole('heading', { name: 'Change your password' })).toBeNull()
    expect(store.getState().nonogramUi.uncertain).toEqual(write)
    expect(unload()).toBe(true)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep puzzle' }))
    expect(store.getState().nonogramUi.busy).toBe(true)
  })

  it('guards sign-out with the same keep/discard boundary', async () => {
    const { store, logout } = await mount('uncertain')
    account()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep puzzle' }))
    expect(logout).not.toHaveBeenCalled()
    expect(store.getState().nonogramUi.uncertain).toEqual(write)
    account()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out and discard' }))
    expect(logout).toHaveBeenCalledOnce()
    expect(store.getState().nonogramUi.draft).toBeNull()
  })

  it('opens clean password settings normally, supports Cancel and password-page sign-out', async () => {
    const { logout } = await mount('clean')
    account()
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(unload()).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    account()
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(logout).toHaveBeenCalledOnce()
  })
})
