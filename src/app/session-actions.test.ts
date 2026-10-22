import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from './store'
import { clearPrivateState } from './session-actions'
import { userReceived } from '../features/auth/auth-slice'
import { notesApi } from '../services/notes-query'
import { removalScheduled } from '../features/removals/removals-slice'
import { testUser, jsonResponse } from '../test/fixtures'
import { request } from '../services/api-client'
const stores: ReturnType<typeof createAppStore>[] = []
afterEach(() => stores.splice(0).forEach((s) => clearPrivateState(s.dispatch)))
describe('sign-out clears private Redux and transport state', () => {
  it('clears the owner cache, pending Undo, identity and transport validators', async () => {
    const store = createAppStore()
    stores.push(store)
    store.dispatch(userReceived(testUser))
    const privateNote = {
      id: '7',
      version: 1,
      title: 'Private test title',
      header: '',
      body: 'Secret body marker',
      footer: '',
      noteDate: '2026-10-22',
      createdAt: '2026-10-22T12:00:00Z',
      updatedAt: '2026-10-22T12:00:00Z',
    }
    await store.dispatch(
      notesApi.util.upsertQueryData('getNotes', testUser.id, {
        ownerId: testUser.id,
        notes: [privateNote],
        activity: [],
      }),
    )
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ownerId: testUser.id, notes: [privateNote], activity: [] }, 200, {
        ETag: '"private"',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await request('/notes')
    store.dispatch(
      removalScheduled({
        key: 'notes:7',
        domain: 'notes',
        item: { id: '7', title: privateNote.title, version: 1 },
        token: 'private-token',
        deadline: Date.now() + 20_000,
        ownerId: testUser.id,
        generation: store.getState().auth.generation,
        sending: false,
      }),
    )
    clearPrivateState(store.dispatch)
    expect(store.getState().auth.user).toBeNull()
    expect(store.getState().removals.entries).toEqual({})
    expect(notesApi.endpoints.getNotes.select(testUser.id)(store.getState()).data).toBeUndefined()
    expect(JSON.stringify(store.getState())).not.toContain('Secret body marker')
    await request('/notes')
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).has('If-None-Match')).toBe(false)
  })
  it('aborts an in-flight private query so it cannot repopulate a signed-out store', async () => {
    const store = createAppStore()
    stores.push(store)
    store.dispatch(userReceived(testUser))
    let aborted = false
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            options.signal?.addEventListener(
              'abort',
              () => {
                aborted = true
                reject(new DOMException('Cancelled', 'AbortError'))
              },
              { once: true },
            )
          }),
      ),
    )
    const pending = store.dispatch(notesApi.endpoints.getNotes.initiate(testUser.id))
    clearPrivateState(store.dispatch)
    await pending
    expect(aborted).toBe(true)
    expect(store.getState().auth.user).toBeNull()
    expect(notesApi.endpoints.getNotes.select(testUser.id)(store.getState()).data).toBeUndefined()
  })
})
