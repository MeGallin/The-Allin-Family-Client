import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { userReceived } from '../auth/auth-slice'
import type { AdvertSnapshot, AdvertRecord } from './types'

type State = {
  ownerId: number | null
  version: number
  current: AdvertRecord | null
  references: Record<string, string>
  enabled: boolean
}
const initial: State = {
  ownerId: null,
  version: -1,
  current: null,
  references: {},
  enabled: false,
}
const slice = createSlice({
  name: 'advertising',
  initialState: initial,
  reducers: {
    advertAccessFailed(state, action: PayloadAction<number>) {
      if (state.ownerId !== action.payload) return
      state.current = null
      state.references = {}
      state.enabled = false
    },
    advertSafetyReceived(
      state,
      action: PayloadAction<{ ownerId: number; snapshot: AdvertSnapshot }>,
    ) {
      if (state.ownerId !== action.payload.ownerId) return
      const { snapshot } = action.payload
      if ((snapshot.version ?? 0) < state.version) return
      state.version = snapshot.version ?? 0
      state.references = snapshot.references
      state.enabled = snapshot.enabled
      if (
        !snapshot.enabled ||
        !snapshot.current ||
        (state.current &&
          snapshot.references[state.current.payload.featureId] !== state.current.featureHash)
      )
        state.current = null
    },
    advertSnapshotReceived(
      state,
      action: PayloadAction<{ ownerId: number; snapshot: AdvertSnapshot }>,
    ) {
      if (state.ownerId !== action.payload.ownerId) return
      const { snapshot } = action.payload
      if ((snapshot.version ?? 0) < state.version) return
      state.version = snapshot.version ?? 0
      state.current = snapshot.current
      state.references = snapshot.references
      state.enabled = snapshot.enabled
      if (
        !snapshot.enabled ||
        (state.current &&
          snapshot.references[state.current.payload.featureId] !== state.current.featureHash)
      )
        state.current = null
    },
  },
  extraReducers: (builder) =>
    builder.addCase(userReceived, (state, action) => {
      if (!action.payload || state.ownerId !== action.payload.id)
        return { ...initial, ownerId: action.payload?.id ?? null }
    }),
})
export const { advertSnapshotReceived, advertSafetyReceived, advertAccessFailed } = slice.actions
export default slice.reducer
