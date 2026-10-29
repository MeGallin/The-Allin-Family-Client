import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type AccentId } from './accent-options'
import { readBrowserAccent } from '../../services/appearance-storage'
type Appearance = { ownerId: number | null; accent: AccentId; persisted: boolean }
const initialState = (): Appearance => ({
  ownerId: null,
  accent: readBrowserAccent(),
  persisted: true,
})
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
