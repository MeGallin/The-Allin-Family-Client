import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
const initialState = {
  busy: false,
  feedback: '',
  addition: null as { title: string; important: boolean; requestKey: string } | null,
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
    additionPrepared(
      state,
      action: PayloadAction<{ title: string; important: boolean; requestKey: string }>,
    ) {
      state.addition = action.payload
    },
    additionCleared(state) {
      state.addition = null
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
} = shoppingUiSlice.actions
export default shoppingUiSlice.reducer
