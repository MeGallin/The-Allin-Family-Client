import { request } from './api-client'
import { getSession } from './auth-api'
import { ApiError } from './api-client'
import type { ShoppingSnapshot } from '../features/shopping/types'

export function getShopping(signal?: AbortSignal) {
  return request<ShoppingSnapshot>('/shopping', undefined, signal)
}

export async function changeShopping(action: 'add' | 'edit' | 'check' | 'remove', body: object) {
  try {
    return await request<ShoppingSnapshot>('/shopping/' + action, body)
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'csrf_failed') throw error
    await getSession()
    return request<ShoppingSnapshot>('/shopping/' + action, body)
  }
}
