import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { userReceived } from '../auth/auth-slice'
import type { NonogramGame, NonogramWrite } from './types'
export type NonogramDraft = {
  ownerId: number
  base: NonogramGame
  cells: string
  assisted: boolean
  past: string[]
  future: string[]
}
const initialState = {
  busy: false,
  error: '',
  conflict: false,
  draft: null as NonogramDraft | null,
  uncertain: null as NonogramWrite | null,
}
const slice = createSlice({
  name: 'nonogramUi',
  initialState,
  reducers: {
    nonogramUiReset: () => initialState,
    nonogramOpened(state, { payload }: { payload: { ownerId: number; game: NonogramGame } }) {
      if (!state.draft)
        state.draft = {
          ownerId: payload.ownerId,
          base: payload.game,
          cells: payload.game.cells,
          assisted: payload.game.assisted,
          past: [],
          future: [],
        }
    },
    nonogramEdited(state, { payload }: PayloadAction<{ cells: string; assisted?: boolean }>) {
      const d = state.draft
      if (!d || state.busy || state.uncertain || state.conflict || d.cells === payload.cells) return
      d.past = [...d.past, d.cells].slice(-100)
      d.future = []
      d.cells = payload.cells
      d.assisted ||= !!payload.assisted
      state.error = ''
    },
    nonogramHistory(state, { payload }: PayloadAction<'undo' | 'redo'>) {
      const d = state.draft
      if (!d || state.busy || state.uncertain || state.conflict) return
      if (payload === 'undo' && d.past.length) {
        d.future = [d.cells, ...d.future].slice(0, 100)
        d.cells = d.past.pop()!
      }
      if (payload === 'redo' && d.future.length) {
        d.past = [...d.past, d.cells].slice(-100)
        d.cells = d.future.shift()!
      }
      state.error = ''
    },
    nonogramWriteStarted(state, { payload }: PayloadAction<NonogramWrite>) {
      state.busy = true
      state.error = ''
      state.uncertain = payload
    },
    nonogramWriteFailed(
      state,
      { payload }: PayloadAction<{ message: string; conflict: boolean; uncertain: boolean }>,
    ) {
      state.error = payload.message
      state.conflict = payload.conflict
      if (!payload.uncertain) state.uncertain = null
    },
    nonogramWriteFinished(state) {
      state.busy = false
    },
    nonogramAccepted(
      state,
      { payload }: PayloadAction<{ ownerId: number; game: NonogramGame | null; reset: boolean }>,
    ) {
      state.uncertain = null
      state.error = ''
      state.conflict = false
      if (!payload.game) state.draft = null
      else if (payload.reset || !state.draft || state.draft.base.puzzleId !== payload.game.puzzleId)
        state.draft = {
          ownerId: payload.ownerId,
          base: payload.game,
          cells: payload.game.cells,
          assisted: payload.game.assisted,
          past: [],
          future: [],
        }
      else {
        state.draft.base = payload.game
        state.draft.cells = payload.game.cells
        state.draft.assisted = payload.game.assisted
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(userReceived, (state, { payload }) => {
      if (!payload || (state.draft && state.draft.ownerId !== payload.id)) return initialState
    })
  },
})
export const {
  nonogramUiReset,
  nonogramOpened,
  nonogramEdited,
  nonogramHistory,
  nonogramWriteStarted,
  nonogramWriteFailed,
  nonogramWriteFinished,
  nonogramAccepted,
} = slice.actions
export const nonogramDirty = (draft: NonogramDraft | null) =>
  !!draft && (draft.cells !== draft.base.cells || draft.assisted !== draft.base.assisted)
export const nonogramPending = (state: typeof initialState) =>
  nonogramDirty(state.draft) || state.busy || !!state.uncertain
export default slice.reducer
