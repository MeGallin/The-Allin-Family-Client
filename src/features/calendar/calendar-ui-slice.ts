import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { EventDraft } from './types'
const initialState = {
  busy: false,
  feedback: '',
  addition: null as (EventDraft & { requestKey: string }) | null,
}
const calendarUi = createSlice({
  name: 'calendarUi',
  initialState,
  reducers: {
    calendarUiReset: () => initialState,
    calendarWriteStarted(state) {
      state.busy = true
      state.feedback = ''
    },
    calendarWriteFinished(state) {
      state.busy = false
    },
    calendarFeedback(state, action: PayloadAction<string>) {
      state.feedback = action.payload
    },
    calendarAdditionPrepared(state, action: PayloadAction<EventDraft & { requestKey: string }>) {
      state.addition = action.payload
    },
    calendarAdditionCleared(state) {
      state.addition = null
    },
  },
})
export const {
  calendarUiReset,
  calendarWriteStarted,
  calendarWriteFinished,
  calendarFeedback,
  calendarAdditionPrepared,
  calendarAdditionCleared,
} = calendarUi.actions
export default calendarUi.reducer
