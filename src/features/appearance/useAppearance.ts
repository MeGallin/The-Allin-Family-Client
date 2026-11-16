import { useEffect, useLayoutEffect } from 'react'
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import {
  accentStorageKey,
  browserAccentStorageKey,
  readBrowserAccent,
  saveBrowserAccent,
  readAccentPreference,
  saveAccentPreference,
} from '../../services/appearance-storage'
import { accentChosen, appearanceLoaded } from './appearance-slice'
import { DEFAULT_ACCENT, type AccentPreference } from './accent-options'
import { customAccentTokens } from './custom-accent'
import { readAccentPalette } from './accent-palette'
import { useRuntimeRule } from '../../styles/runtime-styles'
/** Mount once at the app root, including sign-in and password settings. */
export function useAppearanceTheme() {
  const appearanceStyles = useRuntimeRule({ rootAccent: true })
  const store = useAppStore()
  const dispatch = useAppDispatch()
  const accent = useAppSelector((state) =>
    !state.auth.user || state.auth.user.id === state.appearance.ownerId
      ? state.appearance.accent
      : DEFAULT_ACCENT,
  )
  useLayoutEffect(() => {
    const root = document.documentElement
    if (accent === DEFAULT_ACCENT) root.removeAttribute('data-accent')
    else root.dataset.accent = typeof accent === 'string' ? accent : 'custom'
    const tokens =
      typeof accent === 'object' ? customAccentTokens(accent.hex, readAccentPalette(root)) : {}
    appearanceStyles.update(tokens)
    saveBrowserAccent(accent)
    return () => {
      root.removeAttribute('data-accent')
      appearanceStyles.remove()
    }
  }, [accent, appearanceStyles])
  useEffect(() => {
    function sync(event: StorageEvent) {
      const ownerId = store.getState().auth.user?.id
      const key = ownerId ? accentStorageKey(ownerId) : browserAccentStorageKey
      if (event.key !== null && event.key !== key) return
      try {
        if (event.storageArea !== localStorage) return
      } catch {
        return
      }
      dispatch(
        appearanceLoaded({
          ownerId: ownerId ?? null,
          ...(ownerId
            ? readAccentPreference(ownerId)
            : { accent: readBrowserAccent(), persisted: true }),
        }),
      )
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [dispatch, store])
}
export function useAccentPreference() {
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const preference = useAppSelector((state) => state.appearance)
  return {
    ...preference,
    choose(accent: AccentPreference) {
      const ownerId = store.getState().auth.user?.id
      if (!ownerId || ownerId !== preference.ownerId) return
      const persisted = saveAccentPreference(ownerId, accent)
      dispatch(accentChosen({ ownerId, accent, persisted }))
    },
  }
}
