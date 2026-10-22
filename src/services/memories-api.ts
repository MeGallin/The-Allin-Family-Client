import { apiUrl, request } from './api-client'
import { writeRequest } from './write-request'
import type { FamilyMemory, MemoryAction, MemorySnapshot } from '../features/memories/types'

export const getMemories = (signal?: AbortSignal) =>
  request<MemorySnapshot>('/memories', undefined, signal)
export function memoryPhotoUrl(memory: FamilyMemory, width?: 160 | 480 | 960 | 1600) {
  return apiUrl(
    `/memories/photo?id=${encodeURIComponent(memory.id)}&v=${encodeURIComponent(memory.photoKey ?? '')}${width && (memory.photoWidth ?? Infinity) > width ? '&width=' + width : ''}`,
  )
}

/** Shared responsive image contract for album cards and compact Home thumbnails. */
export function memoryPhotoSources(memory: FamilyMemory, thumbnail = false) {
  const widths = ([160, 480, 960, 1600] as const).filter(
    (width) => (!thumbnail || width <= 480) && (!memory.photoWidth || width < memory.photoWidth),
  )
  const sources = widths.map((width) => `${memoryPhotoUrl(memory, width)} ${width}w`)
  if (memory.photoWidth && memory.photoWidth <= (thumbnail ? 480 : 1600))
    sources.push(`${memoryPhotoUrl(memory)} ${memory.photoWidth}w`)
  return {
    src: memoryPhotoUrl(memory, thumbnail ? 160 : 960),
    srcSet: sources.join(', ') || undefined,
    sizes: thumbnail
      ? '4rem'
      : '(max-width: 48rem) calc(100vw - 2.5rem), (max-width: 80rem) calc((100vw - 18rem) / 2), 36rem',
    width: memory.photoWidth ?? 1200,
    height: memory.photoHeight ?? 700,
  }
}

// Files and AbortControllers remain outside Redux's serializable state/cache.
const uploads = new Set<AbortController>()
export function abortMemoryWrites() {
  uploads.forEach((controller) => controller.abort())
  uploads.clear()
}
export async function changeMemory(action: MemoryAction, body: object, photo?: File) {
  const controller = new AbortController()
  uploads.add(controller)
  const form = new FormData()
  form.set('payload', JSON.stringify(body))
  if (photo) form.set('photo', photo)
  try {
    return await writeRequest<MemorySnapshot>('/memories/' + action, form, controller.signal)
  } finally {
    uploads.delete(controller)
  }
}
