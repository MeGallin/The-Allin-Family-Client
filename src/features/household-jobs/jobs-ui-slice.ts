import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { JobScope } from './types'
const initialState = {
  busy: false,
  error: '',
  feedback: '',
  orderNeedsRefresh: { family: false, mine: false },
}
const slice = createSlice({
  name: 'jobsUi',
  initialState,
  reducers: {
    jobsUiReset: () => initialState,
    jobsOrderUnconfirmed(s, { payload }: PayloadAction<JobScope>) {
      s.orderNeedsRefresh[payload] = true
    },
    jobsOrdersReconciled(s) {
      if (s.orderNeedsRefresh.family || s.orderNeedsRefresh.mine) {
        s.orderNeedsRefresh = { family: false, mine: false }
        s.error = ''
        s.feedback = 'Order refreshed. You can move jobs again.'
      }
    },
    jobsStarted(s) {
      s.busy = true
      s.error = ''
      s.feedback = 'Saving…'
    },
    jobsFinished(s) {
      s.busy = false
    },
    jobsError(s, { payload }: PayloadAction<string>) {
      s.error = payload
      s.feedback = ''
    },
    jobsFeedback(s, { payload }: PayloadAction<string>) {
      s.feedback = payload
      s.error = ''
    },
  },
})
export const {
  jobsOrderUnconfirmed,
  jobsOrdersReconciled,
  jobsUiReset,
  jobsStarted,
  jobsFinished,
  jobsError,
  jobsFeedback,
} = slice.actions
export default slice.reducer
