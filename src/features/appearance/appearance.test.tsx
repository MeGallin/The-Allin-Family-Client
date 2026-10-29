import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
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
  const view = render(
    <Provider store={store}>
      <Appearance />
    </Provider>,
  )
  return { store, ...view }
}

describe('personal accent preferences', () => {
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
