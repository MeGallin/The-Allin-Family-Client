import { ApiError, apiUrl, request } from './api-client'
import { getSession } from './auth-api'
import type { FamilyMemory, MemoryAction, MemorySnapshot } from '../features/memories/types'

export const getMemories = (signal?: AbortSignal) =>
  request<MemorySnapshot>('/memories', undefined, signal)
export function memoryPhotoUrl(memory: FamilyMemory) {
  return apiUrl(
    `/memories/photo?id=${encodeURIComponent(memory.id)}&v=${encodeURIComponent(memory.photoKey ?? '')}`,
  )
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
    try {
      return await request<MemorySnapshot>('/memories/' + action, form, controller.signal)
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'csrf_failed') throw error
      await getSession(controller.signal)
      return await request<MemorySnapshot>('/memories/' + action, form, controller.signal)
    }
  } finally {
    uploads.delete(controller)
  }
}
