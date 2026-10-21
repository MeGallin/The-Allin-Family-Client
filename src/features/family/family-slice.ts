import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PollChoice } from './types'

const initialState = () => ({ pollChoice: null as PollChoice | null })
const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    familyReset: initialState,
    pollChosen(state, action: PayloadAction<PollChoice>) {
      state.pollChoice = action.payload
    },
  },
})
export const { familyReset, pollChosen } = familySlice.actions
export default familySlice.reducer
