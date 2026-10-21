import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ShoppingError } from '../../services/shopping-query'
const initialState = { busy: false, feedback: '', error: null as ShoppingError | null }
const slice = createSlice({
  name: 'memoriesUi',
  initialState,
  reducers: {
    memoriesUiReset: () => initialState,
    memoryWriteStarted(state) {
      state.busy = true
      state.feedback = ''
      state.error = null
    },
    memoryWriteFinished(state) {
      state.busy = false
    },
    memoryWriteFailed(state, action: PayloadAction<ShoppingError>) {
      state.error = action.payload
    },
    memoryFeedback(state, action: PayloadAction<string>) {
      state.feedback = action.payload
    },
    memoryErrorCleared(state) {
      state.error = null
    },
  },
})
export const {
  memoriesUiReset,
  memoryWriteStarted,
  memoryWriteFinished,
  memoryWriteFailed,
  memoryFeedback,
  memoryErrorCleared,
} = slice.actions
export default slice.reducer
