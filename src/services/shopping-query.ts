import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { getShopping, changeShopping } from './shopping-api'
import { ApiError } from './api-client'
import { messageFor } from '../lib/errors'
import type { ShoppingSnapshot } from '../features/shopping/types'

export type ShoppingError = { status: number; code: string; message: string }
export type ShoppingWrite = { action: 'add' | 'edit' | 'check' | 'remove'; body: object }
export function serializableError(error: unknown): ShoppingError {
  return {
    status: error instanceof ApiError ? error.status : 0,
    code: error instanceof ApiError ? error.code : '',
    message: messageFor(error),
  }
}
export function shoppingError(error: unknown): ShoppingError | undefined {
  if (error && typeof error === 'object' && 'status' in error && 'message' in error)
    return error as ShoppingError
  return undefined
}
export const shoppingApi = createApi({
  reducerPath: 'shoppingApi',
  baseQuery: fakeBaseQuery<ShoppingError>(),
  tagTypes: ['Shopping', 'Profiles', 'Calendar', 'Memories'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getShopping: builder.query<ShoppingSnapshot, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getShopping(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Shopping'],
    }),
    changeShopping: builder.mutation<ShoppingSnapshot, ShoppingWrite>({
      async queryFn({ action, body }) {
        try {
          return { data: await changeShopping(action, body) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      invalidatesTags: (_result, error) => (error?.status === 409 ? ['Shopping'] : []),
    }),
  }),
})
