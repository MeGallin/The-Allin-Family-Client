import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { DinnerSpin } from './types'
const initialState = { busy: false, feedback: '', selectedSpin: null as DinnerSpin | null }
const slice = createSlice({
  name: 'widgetsUi',
  initialState,
  reducers: {
    widgetsUiReset: () => initialState,
    widgetWriteStarted(state) {
      state.busy = true
      state.feedback = ''
      state.selectedSpin = null
    },
    widgetWriteFinished(state) {
      state.busy = false
    },
    widgetSaved(state, { payload }: PayloadAction<{ message: string; spin?: DinnerSpin | null }>) {
      state.feedback = payload.message
      state.selectedSpin = payload.spin ?? null
    },
  },
})
export const { widgetsUiReset, widgetWriteStarted, widgetWriteFinished, widgetSaved } =
  slice.actions
export default slice.reducer
