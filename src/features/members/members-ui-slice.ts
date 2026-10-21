import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ShoppingError } from '../../services/shopping-query'
const initialState = { busy: false, error: null as ShoppingError | null }
const slice = createSlice({
  name: 'membersUi',
  initialState,
  reducers: {
    membersUiReset: () => initialState,
    memberWriteStarted(state) {
      state.busy = true
      state.error = null
    },
    memberWriteFinished(state) {
      state.busy = false
    },
    memberWriteFailed(state, action: PayloadAction<ShoppingError>) {
      state.error = action.payload
    },
  },
})
export const { membersUiReset, memberWriteStarted, memberWriteFinished, memberWriteFailed } =
  slice.actions
export default slice.reducer
