import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
const initialState = { busy: false, feedback: '' }
const slice = createSlice({
  name: 'pollsUi',
  initialState,
  reducers: {
    pollsUiReset: () => initialState,
    pollWriteStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    pollWriteFinished(state) {
      state.busy = false
    },
    pollFeedback(state, { payload }: PayloadAction<string>) {
      state.feedback = payload
    },
  },
})
export const { pollsUiReset, pollWriteStarted, pollWriteFinished, pollFeedback } = slice.actions
export default slice.reducer
