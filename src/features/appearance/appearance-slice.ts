import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_ACCENT, type AccentId } from './accent-options'
type Appearance = { ownerId: number | null; accent: AccentId; persisted: boolean }
const initialState: Appearance = { ownerId: null, accent: DEFAULT_ACCENT, persisted: true }
const slice = createSlice({
  name: 'appearance',
  initialState,
  reducers: {
    appearanceLoaded: (_state, { payload }: PayloadAction<Appearance>) => payload,
    accentChosen(state, { payload }: PayloadAction<Appearance>) {
      if (state.ownerId === payload.ownerId) return payload
    },
  },
})
export const { appearanceLoaded, accentChosen } = slice.actions
export default slice.reducer
