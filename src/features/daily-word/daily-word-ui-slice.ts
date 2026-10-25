import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
const initialState = { busy: false, feedback: '' }
const slice = createSlice({
  name: 'dailyWordUi',
  initialState,
  reducers: {
    dailyWordUiReset: () => initialState,
    dailyWordWriteStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    dailyWordWriteFinished(state) {
      state.busy = false
    },
    dailyWordSaved(state, { payload }: PayloadAction<string>) {
      state.feedback = payload
    },
  },
})
export const { dailyWordUiReset, dailyWordWriteStarted, dailyWordWriteFinished, dailyWordSaved } =
  slice.actions
export default slice.reducer
