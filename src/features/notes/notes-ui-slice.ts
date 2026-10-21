import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
const initialState = { busy: false, feedback: '' }
const slice = createSlice({
  name: 'notesUi',
  initialState,
  reducers: {
    notesUiReset: () => initialState,
    noteWriteStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    noteWriteFinished(state) {
      state.busy = false
    },
    noteFeedback(state, action: PayloadAction<string>) {
      state.feedback = action.payload
    },
  },
})
export const { notesUiReset, noteWriteStarted, noteWriteFinished, noteFeedback } = slice.actions
export default slice.reducer
