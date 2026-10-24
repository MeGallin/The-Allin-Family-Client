import { request, ApiError } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import { shoppingApi, serializableError } from './shopping-query'
import type { SudokuSnapshot, SudokuWrite } from '../features/sudoku/types'
export const sudokuApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getSudoku: builder.query<SudokuSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (timed) => request<SudokuSnapshot>('/sudoku', undefined, timed),
            signal,
          )
          if (data.ownerId !== ownerId)
            throw new ApiError(
              'Your account changed. Please sign in again.',
              401,
              'account_changed',
            )
          return { data }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: (_, __, ownerId) => [{ type: 'Sudoku', id: ownerId }],
    }),
    changeSudoku: builder.mutation<SudokuSnapshot, SudokuWrite>({
      async queryFn({ action, body }, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (timed) => writeRequest<SudokuSnapshot>('/sudoku/' + action, body, timed),
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
    }),
  }),
})
