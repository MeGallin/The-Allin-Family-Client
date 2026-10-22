import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createAppStore } from '../../app/store'
import { userReceived } from '../../features/auth/auth-slice'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import { clearPrivateState } from '../../app/session-actions'
import { notesApi } from '../../services/notes-query'
import { testUser, jsonResponse } from '../../test/fixtures'
import NoteComposer from './NoteComposer'
const stores: ReturnType<typeof createAppStore>[] = []
afterEach(() => {
  stores.splice(0).forEach((s) => clearPrivateState(s.dispatch))
})
function editor() {
  const store = createAppStore()
  stores.push(store)
  store.dispatch(userReceived(testUser))
  const close = vi.fn()
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <DraftProtectionProvider>
            <NoteComposer onClose={close} />
          </DraftProtectionProvider>
        ),
      },
    ],
    { initialEntries: ['/notes'] },
  )
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { store, close }
}
function fill() {
  for (const [label, value] of [
    ['Title', 'A private thought'],
    ['Header (optional)', 'Header'],
    ['Body', 'Private body'],
    ['Footer (optional)', 'Footer'],
    ['Note date', '2026-10-22'],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } })
}
describe('private note editor and real Redux write flow', () => {
  it('saves all form fields through the shared service and updates its owner cache', async () => {
    let savedNotes: object[] = []
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.body) {
        const draft = JSON.parse(String(options.body))
        savedNotes = [
          {
            ...draft,
            id: '7',
            version: 1,
            createdAt: '2026-10-22T12:00:00Z',
            updatedAt: '2026-10-22T12:00:00Z',
          },
        ]
      }
      return jsonResponse({ ownerId: testUser.id, notes: savedNotes, activity: [] })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { store, close } = editor()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    const saved = notesApi.endpoints.getNotes.select(testUser.id)(store.getState()).data?.notes[0]
    expect(saved).toMatchObject({
      title: 'A private thought',
      header: 'Header',
      body: 'Private body',
      footer: 'Footer',
      noteDate: '2026-10-22',
    })
    const call = fetchMock.mock.calls.find(([url]) => url.endsWith('/notes/add'))!
    expect(JSON.parse(String(call[1]?.body)).requestKey).toMatch(/^[a-f0-9-]{36}$/)
    expect(notesApi.endpoints.getNotes.select(202)(store.getState()).data).toBeUndefined()
  })
  it('keeps writing and shows feedback when a save fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, options?: RequestInit) =>
        options?.body
          ? jsonResponse({ error: 'Connection lost' }, 503)
          : jsonResponse({ ownerId: testUser.id, notes: [], activity: [] }),
      ),
    )
    const { close } = editor()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Connection lost'))
    expect((screen.getByLabelText('Body') as HTMLTextAreaElement).value).toBe('Private body')
    expect(close).not.toHaveBeenCalled()
  })
  it('asks before discarding unsaved writing and Keep editing retains it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ ownerId: testUser.id, notes: [], activity: [] })),
    )
    const { close } = editor()
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect((screen.getByLabelText('Body') as HTMLTextAreaElement).value).toBe('Private body')
    expect(close).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await act(async () => {})
    expect(close).toHaveBeenCalledOnce()
  })
})
