import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createSampleFamilyData } from './data/sample-family'
import type { FamilyEvent, FamilyMemory, PollChoice } from './types'

const initialState = () => ({ ...createSampleFamilyData(), pollChoice: null as PollChoice | null })
const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    familyReset: initialState,
    memoryAdded(state, action: PayloadAction<FamilyMemory>) {
      state.memories.unshift(action.payload)
    },
    reactionToggled(state, action: PayloadAction<string>) {
      const memory = state.memories.find((item) => item.id === action.payload)
      if (memory) {
        memory.liked = !memory.liked
        memory.reactions += memory.liked ? 1 : -1
      }
    },
    eventAdded(state, action: PayloadAction<FamilyEvent>) {
      state.events.push(action.payload)
    },
    pollChosen(state, action: PayloadAction<PollChoice>) {
      state.pollChoice = action.payload
    },
  },
})
export const { familyReset, memoryAdded, reactionToggled, eventAdded, pollChosen } =
  familySlice.actions
export default familySlice.reducer
