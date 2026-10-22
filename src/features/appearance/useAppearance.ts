import { useEffect, useLayoutEffect } from 'react'
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import {
  accentStorageKey,
  readAccentPreference,
  saveAccentPreference,
} from '../../services/appearance-storage'
import { accentChosen, appearanceLoaded } from './appearance-slice'
import { DEFAULT_ACCENT, type AccentId } from './accent-options'
/** Mount once at the app root, including sign-in and password settings. */
export function useAppearanceTheme() {
  const store = useAppStore()
  const dispatch = useAppDispatch()
  const accent = useAppSelector((state) =>
    state.auth.user?.id === state.appearance.ownerId ? state.appearance.accent : DEFAULT_ACCENT,
  )
  useLayoutEffect(() => {
    const root = document.documentElement
    if (accent === DEFAULT_ACCENT) root.removeAttribute('data-accent')
    else root.dataset.accent = accent
    return () => root.removeAttribute('data-accent')
  }, [accent])
  useEffect(() => {
    function sync(event: StorageEvent) {
      const ownerId = store.getState().auth.user?.id
      if (!ownerId || (event.key !== null && event.key !== accentStorageKey(ownerId))) return
      try {
        if (event.storageArea !== localStorage) return
      } catch {
        return
      }
      dispatch(appearanceLoaded({ ownerId, ...readAccentPreference(ownerId) }))
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
    choose(accent: AccentId) {
      const ownerId = store.getState().auth.user?.id
      if (!ownerId || ownerId !== preference.ownerId) return
      const persisted = saveAccentPreference(ownerId, accent)
      dispatch(accentChosen({ ownerId, accent, persisted }))
    },
  }
}
