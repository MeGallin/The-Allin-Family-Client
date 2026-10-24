import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
const initialState = { busy: false, feedback: '' }
const slice = createSlice({
  name: 'sudokuUi',
  initialState,
  reducers: {
    sudokuUiReset: () => initialState,
    sudokuWriteStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    sudokuWriteFinished(state) {
      state.busy = false
    },
    sudokuSaved(state, { payload }: PayloadAction<string>) {
      state.feedback = payload
    },
  },
})
export const { sudokuUiReset, sudokuWriteStarted, sudokuWriteFinished, sudokuSaved } = slice.actions
export default slice.reducer
