import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ShoppingItem } from './types'
export const REMOVAL_DELAY_MS = 30000
export type PendingRemoval = {
  item: ShoppingItem
  token: string
  deadline: number
  sending: boolean
}
const initialState = {
  busy: false,
  feedback: '',
  addition: null as { title: string; requestKey: string } | null,
  removals: {} as Record<string, PendingRemoval>,
}
const shoppingUiSlice = createSlice({
  name: 'shoppingUi',
  initialState,
  reducers: {
    shoppingUiReset: () => initialState,
    writeStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    writeFinished(state) {
      state.busy = false
    },
    feedbackReceived(state, action: PayloadAction<string>) {
      state.feedback = action.payload
    },
    additionPrepared(state, action: PayloadAction<{ title: string; requestKey: string }>) {
      state.addition = action.payload
    },
    additionCleared(state) {
      state.addition = null
    },
    removalScheduled(state, action: PayloadAction<PendingRemoval>) {
      if (!state.removals[action.payload.item.id]) {
        state.removals[action.payload.item.id] = action.payload
        state.feedback = 'Removal scheduled. You have 30 seconds to undo it.'
      }
    },
    removalUndone(state, action: PayloadAction<string>) {
      if (state.removals[action.payload] && !state.removals[action.payload].sending) {
        delete state.removals[action.payload]
        state.feedback = 'Removal cancelled. The item is still on the shared list.'
      }
    },
    removalSending(state, action: PayloadAction<{ id: string; token: string }>) {
      const pending = state.removals[action.payload.id]
      if (pending?.token === action.payload.token) pending.sending = true
    },
    removalFinished(state, action: PayloadAction<{ id: string; token: string }>) {
      if (state.removals[action.payload.id]?.token === action.payload.token)
        delete state.removals[action.payload.id]
    },
    waitingRemovalsCancelled(state) {
      Object.entries(state.removals).forEach(([id, entry]) => {
        if (!entry.sending) delete state.removals[id]
      })
    },
  },
})
export const {
  shoppingUiReset,
  writeStarted,
  writeFinished,
  feedbackReceived,
  additionPrepared,
  additionCleared,
  removalScheduled,
  removalUndone,
  removalSending,
  removalFinished,
  waitingRemovalsCancelled,
} = shoppingUiSlice.actions
export default shoppingUiSlice.reducer
