import { request } from './api-client'
import { writeRequest } from './write-request'
import type { ShoppingSnapshot } from '../features/shopping/types'
export const getShopping = (signal?: AbortSignal) =>
  request<ShoppingSnapshot>('/shopping', undefined, signal)
export const changeShopping = (
  action: 'add' | 'edit' | 'check' | 'remove',
  body: object,
  signal?: AbortSignal,
) => writeRequest<ShoppingSnapshot>('/shopping/' + action, body, signal)
