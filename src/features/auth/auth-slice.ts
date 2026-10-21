import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FamilyUser } from '../../types/auth'

// Only the public profile belongs in Redux. Cookies and CSRF stay in the API layer.
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as FamilyUser | null, generation: 0 },
  reducers: {
    userReceived(state, action: PayloadAction<FamilyUser | null>) {
      if (
        action.payload &&
        state.user?.id === action.payload.id &&
        state.user.profileVersion > action.payload.profileVersion
      )
        return
      if (!action.payload || state.user?.id !== action.payload.id) state.generation += 1
      state.user = action.payload
    },
  },
})
export const { userReceived } = authSlice.actions
export default authSlice.reducer
