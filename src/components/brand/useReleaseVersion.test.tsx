import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import release from '../../app-version.json'
import { useReleaseVersion } from './useReleaseVersion'

it('identifies the bundled client without API requests, timers or focus refresh', async () => {
  const fetch = vi.mocked(globalThis.fetch)
  const { result } = renderHook(useReleaseVersion)
  expect(result.current).toBe(release.version)
  await act(async () => window.dispatchEvent(new Event('focus')))
  expect(result.current).toBe(release.version)
  expect(fetch).not.toHaveBeenCalled()
})

it('uses the client build candidate even when it differs from development metadata', async () => {
  vi.resetModules()
  vi.stubGlobal('__CLIENT_BUILD_VERSION__', '1.25')
  const { useReleaseVersion: builtVersion } = await import('./useReleaseVersion')
  const { result } = renderHook(builtVersion)
  expect(result.current).toBe('1.25')
  expect(globalThis.fetch).not.toHaveBeenCalled()
})
