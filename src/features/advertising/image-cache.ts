import type { Middleware } from '@reduxjs/toolkit'

let sessionEpoch = 0
export const advertImageSessionEpoch = () => sessionEpoch
const cached = new Map<string, string>()
export function clearAdvertImage() {
  for (const url of cached.values()) URL.revokeObjectURL(url)
  cached.clear()
}
export function cachedAdvertImage(key: string) {
  return cached.get(key) ?? null
}
export function releaseAdvertImage(key: string, expectedUrl?: string) {
  const url = cached.get(key)
  if (!url || (expectedUrl && url !== expectedUrl)) return
  URL.revokeObjectURL(url)
  cached.delete(key)
}
export function retainAdvertImage(key: string, url: string) {
  const previous = cached.get(key)
  if (previous && previous !== url) URL.revokeObjectURL(previous)
  cached.set(key, url)
}
// Keep the displayed pair across Home unmounts and stage its successor before
// publication handoff. Blob URLs and private bytes never enter Redux/storage.
export const advertImageLifecycle: Middleware = (store) => (next) => (action) => {
  const before = store.getState() as ImageState
  const result = next(action)
  const after = store.getState() as ImageState
  if (before.auth.generation !== after.auth.generation) sessionEpoch += 1
  if (before.auth.generation !== after.auth.generation) clearAdvertImage()
  else if (
    before.advertising.current?.image?.id !== after.advertising.current?.image?.id ||
    (action as { type?: string }).type === 'advertising/advertSnapshotReceived'
  ) {
    const keep =
      after.auth.user?.id + ':' + after.auth.generation + ':' + after.advertising.current?.image?.id
    for (const key of cached.keys()) if (key !== keep) releaseAdvertImage(key)
  }
  return result
}
type ImageState = {
  auth: { generation: number; user: { id: number } | null }
  advertising: { current: { image?: { id: string } } | null }
}
