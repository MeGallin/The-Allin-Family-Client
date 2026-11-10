import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { DraftProtectionProvider } from '../drafts/DraftProtection'
import { createAppStore } from '../../app/store'
import { userReceived } from '../auth/auth-slice'
import { testUser } from '../../test/fixtures'
import { AccentPicker } from '../../components/profile/AccentPicker'
import { useAppearanceTheme } from './useAppearance'
import { ACCENT_CHOICES } from './accent-options'
import {
  accentStorageKey,
  browserAccentStorageKey,
  readAccentPreference,
  saveAccentPreference,
} from '../../services/appearance-storage'

beforeEach(() => localStorage.clear())
afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-accent')
})

function mount(signedIn = true) {
  const store = createAppStore()
  if (signedIn) store.dispatch(userReceived(testUser))
  function Appearance() {
    useAppearanceTheme()
    return <AccentPicker />
  }
  const router = createMemoryRouter([
    {
      path: '*',
      element: (
        <Provider store={store}>
          <DraftProtectionProvider>
            <Appearance />
          </DraftProtectionProvider>
        </Provider>
      ),
    },
  ])
  const view = render(<RouterProvider router={router} />)
  return { store, router, ...view }
}

describe('personal accent preferences', () => {
  it('restores anonymous custom branding before login without exposing an owner preference', () => {
    localStorage.setItem(
      browserAccentStorageKey,
      JSON.stringify({ version: 2, kind: 'custom', hex: '#FFFFFF' }),
    )
    const { store } = mount(false)
    expect(document.documentElement.dataset.accent).toBe('custom')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('#FFFFFF')
    act(() => {
      store.dispatch(userReceived(testUser))
    })
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('')
  })

  it('applies custom for this visit when storage is blocked and survives a profile refresh', () => {
    const { store } = mount()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom colour' }))
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply colour' }))
    expect(screen.getByRole('status').textContent).toContain("couldn't save")
    act(() => {
      store.dispatch(userReceived({ ...testUser, profileVersion: 2 }))
    })
    expect(document.documentElement.dataset.accent).toBe('custom')
    expect(store.getState().appearance.accent).toEqual({
      version: 2,
      kind: 'custom',
      hex: '#000000',
    })
  })
  it('preserves an open draft and focus across same-account storage updates', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom colour' }))
    const input = screen.getByLabelText('HEX value') as HTMLInputElement
    fireEvent.change(input, { target: { value: '#123456' } })
    const sync = () =>
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: accentStorageKey(testUser.id),
            storageArea: localStorage,
          }),
        )
      })
    saveAccentPreference(testUser.id, 'pink')
    sync()
    expect(screen.getByLabelText('HEX value')).toBe(input)
    expect(input.value).toBe('#123456')
    expect(document.activeElement).toBe(input)
    expect(screen.getByText(/Your saved colour changed in another tab/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply colour' }))
    expect(readAccentPreference(testUser.id).accent).toEqual({
      version: 2,
      kind: 'custom',
      hex: '#123456',
    })
    fireEvent.click(screen.getByRole('button', { name: /Custom colour selected/ }))
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#ABCDEF' } })
    saveAccentPreference(testUser.id, 'gold')
    sync()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(readAccentPreference(testUser.id).accent).toBe('gold')
    expect(document.documentElement.dataset.accent).toBe('gold')
  })
  it('keeps drafts local, validates HEX, applies explicitly and restores custom after reload', () => {
    const view = mount()
    const trigger = screen.getByRole('button', { name: 'Choose a custom colour' })
    fireEvent.click(trigger)
    expect(document.activeElement).toBe(screen.getByLabelText('HEX value'))
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: 'bad' } })
    expect(
      (screen.getByRole('button', { name: 'Apply colour' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#345678' } })
    expect(readAccentPreference(testUser.id).accent).toBe('cyan')
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
    expect(screen.getByRole('img', { name: /Draft preview #345678/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Apply colour' }))
    expect(document.activeElement).toBe(trigger)
    expect(readAccentPreference(testUser.id).accent).toEqual({
      version: 2,
      kind: 'custom',
      hex: '#345678',
    })
    expect(document.documentElement.dataset.accent).toBe('custom')
    expect(document.documentElement.style.getPropertyValue('--color-accent')).not.toBe('#345678')
    view.unmount()
    mount()
    expect(screen.getByRole('button', { name: /Custom colour selected #345678/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: 'Pink' }))
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('')
  })

  it('discards on Cancel/Escape/preset and resets an open draft when the account changes', () => {
    const { store } = mount()
    const open = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Choose a custom colour' }))
    open()
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#000000' } })
    fireEvent.keyDown(screen.getByLabelText('HEX value'), { key: 'Escape' })
    expect(screen.queryByLabelText('HEX value')).toBeNull()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Choose a custom colour' }),
    )
    open()
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#FFFFFF' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    open()
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#123456' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Turquoise' }))
    expect(screen.queryByLabelText('HEX value')).toBeNull()
    open()
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#123456' } })
    act(() => {
      store.dispatch(userReceived({ ...testUser, id: 202 }))
    })
    expect(screen.queryByLabelText('HEX value')).toBeNull()
    expect(readAccentPreference(testUser.id).accent).toBe('cyan')
    expect(readAccentPreference(202).accent).toBe('cyan')
  })

  it('protects only changed drafts when navigating between Profile views', async () => {
    const { router } = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Choose a custom colour' }))
    await act(async () => {
      await router.navigate('/?view=identity')
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.change(screen.getByLabelText('HEX value'), { target: { value: '#123456' } })
    await act(async () => {
      await router.navigate('/?view=appearance')
    })
    expect(screen.getByRole('dialog', { name: 'Discard unsaved changes?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect((screen.getByLabelText('HEX value') as HTMLInputElement).value).toBe('#123456')
  })

  it('retains custom branding when signed out but loads each account independently', () => {
    const custom = { version: 2, kind: 'custom', hex: '#000000' } as const
    saveAccentPreference(testUser.id, custom)
    const { store } = mount()
    act(() => {
      store.dispatch(userReceived(null))
    })
    expect(document.documentElement.dataset.accent).toBe('custom')
    expect(JSON.parse(localStorage.getItem(browserAccentStorageKey)!)).toEqual(custom)
    act(() => {
      store.dispatch(userReceived({ ...testUser, id: 202 }))
    })
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
    expect(document.documentElement.style.getPropertyValue('--color-accent')).toBe('')
  })

  it('applies every palette immediately and restores the saved choice in a fresh session', () => {
    const view = mount()
    for (const choice of ACCENT_CHOICES) {
      fireEvent.click(screen.getByRole('radio', { name: choice.label }))
      expect(document.documentElement.getAttribute('data-accent')).toBe(
        choice.id === 'cyan' ? null : choice.id,
      )
      expect(readAccentPreference(testUser.id).accent).toBe(choice.id)
    }
    view.unmount()
    mount()
    expect((screen.getByRole('radio', { name: 'Green' }) as HTMLInputElement).checked).toBe(true)
    expect(document.documentElement.dataset.accent).toBe('green')
  })

  it('isolates owners, retains the last visual accent on sign-out and restores each owner on sign-in', () => {
    const { store } = mount()
    fireEvent.click(screen.getByRole('radio', { name: 'Orange' }))
    const other = { ...testUser, id: 202 }
    act(() => {
      store.dispatch(userReceived(other))
    })
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
    fireEvent.click(screen.getByRole('radio', { name: 'Purple' }))
    act(() => {
      store.dispatch(userReceived(null))
    })
    expect(document.documentElement.dataset.accent).toBe('purple')
    expect(store.getState().appearance.ownerId).toBeNull()
    act(() => {
      store.dispatch(userReceived(testUser))
    })
    expect(document.documentElement.dataset.accent).toBe('orange')
    act(() => {
      store.dispatch(userReceived(other))
    })
    expect(document.documentElement.dataset.accent).toBe('purple')
    expect(readAccentPreference(testUser.id).accent).toBe('orange')
  })

  it('restores only the browser accent before login and the owner preference after login', () => {
    localStorage.setItem(browserAccentStorageKey, 'pink')
    saveAccentPreference(testUser.id, 'green')
    const { store } = mount(false)
    expect(document.documentElement.dataset.accent).toBe('pink')
    expect(store.getState().appearance.ownerId).toBeNull()
    act(() => {
      store.dispatch(userReceived(testUser))
    })
    expect(document.documentElement.dataset.accent).toBe('green')
    expect(localStorage.getItem(browserAccentStorageKey)).toBe('green')
  })

  it('uses turquoise for an invalid browser accent', () => {
    localStorage.setItem(browserAccentStorageKey, 'invalid-css')
    mount(false)
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
  })

  it('syncs same-owner tabs, ignores other owners and handles storage clearing', () => {
    mount()
    saveAccentPreference(202, 'pink')
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: accentStorageKey(202), storageArea: localStorage }),
      )
    })
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
    saveAccentPreference(testUser.id, 'gold')
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: accentStorageKey(testUser.id),
          storageArea: localStorage,
        }),
      )
    })
    expect(document.documentElement.dataset.accent).toBe('gold')
    localStorage.clear()
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))
    })
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false)
  })

  it('keeps an unsaved choice usable when storage is blocked, including profile refreshes', () => {
    const { store } = mount()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Pink' }))
    expect(screen.getByRole('status').textContent).toContain("couldn't save")
    act(() => {
      store.dispatch(userReceived({ ...testUser, profileVersion: 2 }))
    })
    expect(document.documentElement.dataset.accent).toBe('pink')
  })

  it('rejects invalid owners and palette values and removes only this owner’s default override', () => {
    expect(saveAccentPreference(-1, 'orange')).toBe(false)
    expect(readAccentPreference(NaN).persisted).toBe(false)
    localStorage.setItem(accentStorageKey(testUser.id), 'not-css')
    expect(readAccentPreference(testUser.id).accent).toBe('cyan')
    saveAccentPreference(202, 'gold')
    saveAccentPreference(testUser.id, 'cyan')
    expect(localStorage.getItem(accentStorageKey(testUser.id))).toBeNull()
    expect(readAccentPreference(202).accent).toBe('gold')
  })

  it('falls back safely when reading or removing storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    expect(readAccentPreference(testUser.id)).toEqual({ accent: 'cyan', persisted: false })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    expect(saveAccentPreference(testUser.id, 'cyan')).toBe(false)
  })
})
