import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { userReceived } from '../auth/auth-slice'
export const REMOVAL_DELAY_MS = 20_000
export type RemovalDomain = 'shopping' | 'calendar' | 'memories' | 'notes' | 'polls'
export type RemovalRecord = { id: string; title: string; version: number }
export type PendingRemoval = {
  key: string
  domain: RemovalDomain
  item: RemovalRecord
  token: string
  deadline: number
  sending: boolean
  ownerId: number
  generation: number
}
const initialState = { entries: {} as Record<string, PendingRemoval>, feedback: '' }
const slice = createSlice({
  name: 'removals',
  initialState,
  reducers: {
    removalScheduled(state, { payload }: PayloadAction<PendingRemoval>) {
      if (!state.entries[payload.key]) {
        state.entries[payload.key] = payload
        state.feedback = `Removal scheduled. You have ${REMOVAL_DELAY_MS / 1000} seconds to undo it.`
      }
    },
    removalUndone(state, { payload }: PayloadAction<string>) {
      if (state.entries[payload] && !state.entries[payload].sending) {
        delete state.entries[payload]
        state.feedback = 'Removal cancelled. Your content has been kept.'
      }
    },
    removalSending(state, { payload }: PayloadAction<{ key: string; token: string }>) {
      if (state.entries[payload.key]?.token === payload.token)
        state.entries[payload.key].sending = true
    },
    removalFinished(
      state,
      { payload }: PayloadAction<{ key: string; token: string; message: string }>,
    ) {
      if (state.entries[payload.key]?.token === payload.token) {
        delete state.entries[payload.key]
        state.feedback = payload.message
      }
    },
    waitingRemovalsCancelled(state) {
      Object.entries(state.entries).forEach(([key, entry]) => {
        if (!entry.sending) delete state.entries[key]
      })
    },
    removalsReset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(userReceived, (state, { payload }) => {
      if (!payload || Object.values(state.entries).some((entry) => entry.ownerId !== payload.id))
        return initialState
    })
  },
})
export const {
  removalScheduled,
  removalUndone,
  removalSending,
  removalFinished,
  waitingRemovalsCancelled,
  removalsReset,
} = slice.actions
export default slice.reducer
