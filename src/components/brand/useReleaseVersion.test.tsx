import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import release from '../../app-version.json'
import { useReleaseVersion } from './useReleaseVersion'
const api = vi.hoisted(() => ({ request: vi.fn() }))
const newerVersion = (Number(release.version) + 0.05).toFixed(2)
vi.mock('../../services/api-client', () => ({ request: api.request }))
beforeEach(() => {
  api.request.mockReset()
})
describe('canonical bundled and public API release selection', () => {
  it.each(['0.1', 'invalid', null])(
    'retains bundled version for older or invalid API value %s',
    async (version) => {
      api.request.mockResolvedValue({ version })
      const { result } = renderHook(useReleaseVersion)
      expect(result.current).toBe(release.version)
      await waitFor(() => expect(api.request).toHaveBeenCalledOnce())
      expect(result.current).toBe(release.version)
    },
  )
  it('chooses a newer API version and does not downgrade on subsequent focus refresh', async () => {
    api.request
      .mockResolvedValueOnce({ version: newerVersion })
      .mockResolvedValue({ version: '0.1' })
    const { result } = renderHook(useReleaseVersion)
    await waitFor(() => expect(result.current).toBe(newerVersion))
    await act(async () => window.dispatchEvent(new Event('focus')))
    expect(api.request).toHaveBeenCalledTimes(2)
    expect(result.current).toBe(newerVersion)
  })
  it('retains the bundle when the API is unavailable', async () => {
    api.request.mockRejectedValue(new Error('Synthetic unavailable API'))
    const { result } = renderHook(useReleaseVersion)
    await waitFor(() => expect(api.request).toHaveBeenCalledOnce())
    expect(result.current).toBe(release.version)
  })
})
