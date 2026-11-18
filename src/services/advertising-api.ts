import { ApiError, request } from './api-client'
import { withRequestTimeout } from './request-timeout'
import type { AdvertAdmin, AdvertSnapshot } from '../features/advertising/types'

export const getAdvertSnapshot = (signal?: AbortSignal) =>
  withRequestTimeout(
    (bounded) => request<AdvertSnapshot>('/advertising', undefined, bounded),
    signal,
  )
export const getAdvertAdmin = (signal?: AbortSignal) =>
  withRequestTimeout(
    (bounded) => request<AdvertAdmin>('/admin/advertising', undefined, bounded),
    signal,
  )
export const mutateAdvertising = (body: { action?: string; [key: string]: unknown }) =>
  withRequestTimeout(
    (bounded) => request<AdvertAdmin>('/admin/advertising/action', body, bounded),
    undefined,
    body.action === 'prepare' ? 375000 : 15000,
  )
export const getAdvertCredentials = () =>
  withRequestTimeout((bounded) =>
    request<{ credentials: { providerConfigured: boolean; engineAvailable: boolean } }>(
      '/admin/advertising/status',
      undefined,
      bounded,
    ),
  )

// Same session, timeout and stale-response boundary as JSON reads. No provider URLs.
export const getAdvertImage = (id: string, signal?: AbortSignal) => {
  if (!/^[a-f0-9]{48}$/.test(id))
    return Promise.reject(new ApiError('Image unavailable.', 404, 'invalid_image'))
  return withRequestTimeout(async (bounded) => {
    const blob = await request<Blob>('/advertising/image?id=' + id, undefined, bounded, 'blob')
    if (blob.type !== 'image/jpeg' || !blob.size || blob.size > 4194304)
      throw new ApiError('Image unavailable.', 502, 'invalid_image')
    return blob
  }, signal)
}
