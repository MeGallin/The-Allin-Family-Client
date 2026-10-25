import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
const initialState = { busy: false, feedback: '' }
const slice = createSlice({
  name: 'focusTimerUi',
  initialState,
  reducers: {
    focusTimerUiReset: () => initialState,
    focusTimerWriteStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    focusTimerWriteFinished(state) {
      state.busy = false
    },
    focusTimerSaved(state, { payload }: PayloadAction<string>) {
      state.feedback = payload
    },
  },
})
export const {
  focusTimerUiReset,
  focusTimerWriteStarted,
  focusTimerWriteFinished,
  focusTimerSaved,
} = slice.actions
export default slice.reducer
