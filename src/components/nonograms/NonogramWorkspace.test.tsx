import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { Link, Outlet, RouterProvider, createMemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../../features/auth/auth-slice'
import { nonogramApi } from '../../services/nonograms-query'
import {
  nonogramOpened,
  nonogramEdited,
  nonogramAccepted,
  nonogramWriteStarted,
  nonogramWriteFailed,
  nonogramWriteFinished,
} from '../../features/nonograms/nonograms-ui-slice'
import { executeNonogramWrite } from '../../features/nonograms/nonograms-actions'
import { logicalSolution, correctPattern } from '../../features/nonograms/board'
import type { NonogramSnapshot } from '../../features/nonograms/types'
import { jsonResponse, testUser, deferred } from '../../test/fixtures'
import NonogramWorkspace from './NonogramWorkspace'
import { NonogramSync } from './NonogramSync'
const answer = '0010001110001001010101110'
const initial: NonogramSnapshot = {
  ownerId: testUser.id,
  installationVersion: 1,
  played: ['sprout-5'],
  catalogue: [
    {
      puzzleId: 'sprout-5',
      name: 'Sprout',
      size: 5,
      rowClues: [[1], [3], [1], [1, 1, 1], [3]],
      columnClues: [[1], [1, 1], [5], [1, 1], [1]],
      played: true,
    },
    {
      puzzleId: 'cup-5',
      name: 'Cup',
      size: 5,
      rowClues: [[0], [4], [1, 2], [4], [2]],
      columnClues: [[3], [1, 2], [1, 2], [3], [1]],
      played: false,
    },
  ],
  game: {
    puzzleId: 'sprout-5',
    name: 'Sprout',
    size: 5,
    rowClues: [[1], [3], [1], [1, 1, 1], [3]],
    columnClues: [[1], [1, 1], [5], [1, 1], [1]],
    id: 'nonograms',
    title: 'Nonograms',
    version: 1,
    cells: '0'.repeat(25),
    assisted: false,
    completedAt: null,
    updatedAt: '2026-11-10T12:00:00Z',
    replay: false,
  },
}
const stores: ReturnType<typeof createAppStore>[] = []
async function setup() {
  const store = createAppStore()
  stores.push(store)
  store.dispatch(userReceived(testUser))
  await store.dispatch(nonogramApi.util.upsertQueryData('getNonogram', testUser.id, initial))
  let saved = structuredClone(initial)
  const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
    if (init?.body) {
      const b = JSON.parse(String(init.body))
      saved = {
        ...saved,
        installationVersion: saved.installationVersion + 1,
        game: { ...saved.game!, ...b, version: saved.installationVersion + 1 },
      }
    }
    return jsonResponse(saved)
  })
  vi.stubGlobal('fetch', fetch)
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <NonogramSync />
            <Outlet />
          </>
        ),
        children: [
          {
            path: 'my-space',
            element: (
              <>
                <NonogramWorkspace onInstall={vi.fn()} />
                <Link to="/elsewhere">Leave puzzle</Link>
              </>
            ),
          },
          { path: 'elsewhere', element: <p>Elsewhere</p> },
        ],
      },
    ],
    { initialEntries: ['/my-space?view=widgets&tool=nonograms'] },
  )
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /^Row 1, column 1:/ })).not.toBeNull(),
  )
  return { store, fetch, router }
}
const cell = (r = 1, c = 1) =>
  screen.getByRole('button', { name: new RegExp(`^Row ${r}, column ${c}:`) })
afterEach(() => stores.splice(0).forEach((s) => clearPrivateState(s.dispatch)))
describe('Nonograms play, autosave and private draft recovery', () => {
  it('solves the clues without guesses and recognises filled pattern with unknown empties', () => {
    expect(logicalSolution(initial.game!)).toBe(answer)
    expect(correctPattern(answer, answer)).toBe(true)
    expect(correctPattern('0'.repeat(25), answer)).toBe(false)
  })
  it('supports roving keyboard, one-step Undo/Redo, non-mutating Check and honest Hint Undo', async () => {
    const { store } = await setup()
    fireEvent.keyDown(cell(), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cell(1, 2))
    fireEvent.keyDown(cell(1, 2), { key: 'x' })
    expect(cell(1, 2).getAttribute('aria-label')).toContain('marked empty')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(cell(1, 2).getAttribute('aria-label')).toContain('unknown')
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(cell(1, 2).getAttribute('aria-label')).toContain('marked empty')
    const before = store.getState().nonogramUi.draft!.cells
    fireEvent.click(screen.getByRole('button', { name: 'Check progress' }))
    expect(store.getState().nonogramUi.draft!.cells).toBe(before)
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
    expect(store.getState().nonogramUi.draft!.assisted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(store.getState().nonogramUi.draft!.assisted).toBe(true)
  })
  it('keeps saving after navigation during debounce and guards refresh until acknowledged', async () => {
    const { store, fetch, router } = await setup()
    fireEvent.click(cell())
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole('link', { name: 'Leave puzzle' }))
    expect(router.state.location.pathname).toBe('/elsewhere')
    await waitFor(
      () =>
        expect(
          fetch.mock.calls.some(
            ([url, init]) =>
              String(url).endsWith('/nonograms/save') &&
              JSON.parse(String(init?.body)).cells.startsWith('1'),
          ),
        ).toBe(true),
      { timeout: 2500 },
    )
    await waitFor(() => expect(store.getState().nonogramUi.draft!.base.cells[0]).toBe('1'))
    const safe = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(safe)
    expect(safe.defaultPrevented).toBe(false)
  })
  it('retries an uncertain reset from inside its modal using the identical request', async () => {
    const { store, fetch } = await setup()
    fetch.mockImplementation(async (url, init) => {
      if (String(url).endsWith('/nonograms/restart'))
        return jsonResponse({ error: 'Temporarily unavailable' }, 503)
      return jsonResponse(initial)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reset puzzle' }))
    const modal = screen.getByRole('dialog', { name: 'Reset this puzzle?' })
    fireEvent.click(within(modal).getByRole('button', { name: 'Reset puzzle' }))
    await waitFor(() =>
      expect(within(modal).getByRole('button', { name: 'Retry pending action' })).not.toBeNull(),
    )
    const retained = structuredClone(store.getState().nonogramUi.uncertain)
    fetch.mockResolvedValue(
      jsonResponse({ ...initial, installationVersion: 2, game: { ...initial.game!, version: 2 } }),
    )
    fireEvent.click(within(modal).getByRole('button', { name: 'Retry pending action' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const posts = fetch.mock.calls
      .filter(([url]) => String(url).endsWith('/nonograms/restart'))
      .map(([, i]) => JSON.parse(String(i?.body)))
    expect(posts).toHaveLength(2)
    expect(posts[0]).toEqual(retained!.body)
    expect(posts[1]).toEqual(posts[0])
  })
  it('accepts the freshly returned marks and clears a real 409 after confirmed Load latest', async () => {
    const { store, fetch } = await setup()
    fireEvent.click(cell(1, 3))
    const remote = {
      ...initial,
      installationVersion: 2,
      game: { ...initial.game!, version: 2, cells: '02' + '0'.repeat(23) },
    }
    fetch.mockImplementation(async (_url, init) =>
      init?.body
        ? jsonResponse({ error: 'Your puzzle changed', code: 'nonogram_conflict' }, 409)
        : jsonResponse(remote),
    )
    await waitFor(() => expect(store.getState().nonogramUi.conflict).toBe(true), { timeout: 2500 })
    expect(store.getState().nonogramUi.draft!.cells[2]).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Load latest board' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Load latest' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(store.getState().nonogramUi.draft!.cells).toBe(remote.game.cells)
    expect(cell(1, 2).getAttribute('aria-label')).toContain('marked empty')
    expect(cell(1, 3).getAttribute('aria-label')).toContain('unknown')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(store.getState().nonogramUi.conflict).toBe(false)
  })
  it('does not discard local marks when loading latest fails', async () => {
    const { store, fetch } = await setup()
    fetch.mockImplementation(async (_url, init) =>
      init?.body
        ? jsonResponse({ error: 'Changed', code: 'nonogram_conflict' }, 409)
        : jsonResponse({
            ...initial,
            installationVersion: 2,
            game: { ...initial.game!, version: 2 },
          }),
    )
    fireEvent.click(cell())
    await waitFor(() => expect(store.getState().nonogramUi.conflict).toBe(true), { timeout: 2500 })
    fireEvent.click(screen.getByRole('button', { name: 'Load latest board' }))
    fetch.mockRejectedValue(new Error('offline'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Load latest' }))
    await waitFor(() =>
      expect(screen.getAllByText(/Could not load the latest board/).length).toBeGreaterThan(0),
    )
    expect(store.getState().nonogramUi.draft!.cells[0]).toBe('1')
    expect(screen.getByRole('dialog')).not.toBeNull()
  })
  it('clears private draft and ignores a late accepted write after account change', async () => {
    const store = createAppStore()
    stores.push(store)
    store.dispatch(userReceived(testUser))
    store.dispatch(nonogramOpened({ ownerId: testUser.id, game: initial.game! }))
    store.dispatch(nonogramEdited({ cells: '1' + '0'.repeat(24) }))
    const waiting = deferred<Response>()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => waiting.promise),
    )
    const pending = store.dispatch(
      executeNonogramWrite({
        action: 'save',
        body: {
          id: 'nonograms',
          puzzleId: 'sprout-5',
          version: 1,
          cells: '1' + '0'.repeat(24),
          assisted: false,
          requestKey: crypto.randomUUID(),
        },
      }),
    )
    clearPrivateState(store.dispatch)
    waiting.resolve(
      jsonResponse({ ...initial, installationVersion: 2, game: { ...initial.game!, version: 2 } }),
    )
    expect(await pending).toBe(false)
    expect(store.getState().nonogramUi.draft).toBeNull()
    expect(
      nonogramApi.endpoints.getNonogram.select(testUser.id)(store.getState()).data,
    ).toBeUndefined()
  })
})

// A GET begun after write-start must not replace the later acknowledgement.
describe('Nonograms monotonic owner snapshots', () => {
  it.each(['save', 'remove', 'install'] as const)(
    'keeps the acknowledged %s when an ordinary GET resolves late',
    async (action) => {
      const { store, fetch } = await setup()
      const prior: NonogramSnapshot =
        action === 'install' ? { ...initial, installationVersion: 2, game: null } : initial
      if (action === 'install') {
        await act(async () => {
          await store.dispatch(nonogramApi.util.upsertQueryData('getNonogram', testUser.id, prior))
        })
        await waitFor(() => expect(store.getState().nonogramUi.draft).toBeNull())
      }
      const post = deferred<Response>(),
        read = deferred<Response>()
      fetch.mockImplementation(async (_url, init) => (init?.body ? post.promise : read.promise))
      if (action === 'save') fireEvent.click(cell())
      let write!: Promise<boolean>
      act(() => {
        write = store.dispatch(
          executeNonogramWrite({
            action,
            body: {
              id: 'nonograms',
              puzzleId: initial.game!.puzzleId,
              version: prior.installationVersion,
              cells: '1' + '0'.repeat(24),
              assisted: false,
              requestKey: crypto.randomUUID(),
            },
          }),
        )
      })
      expect(store.getState().nonogramUi.busy).toBe(true)
      const get = store.dispatch(
        nonogramApi.endpoints.getNonogram.initiate(testUser.id, {
          forceRefetch: true,
          subscribe: false,
        }),
      )
      await waitFor(() => expect(fetch.mock.calls.some(([, init]) => !init?.body)).toBe(true))
      const acknowledged = {
        ...initial,
        installationVersion: prior.installationVersion + 1,
        game:
          action === 'remove'
            ? null
            : {
                ...initial.game!,
                version: prior.installationVersion + 1,
                puzzleId: action === 'install' ? 'cup-5' : initial.game!.puzzleId,
                cells: '1' + '0'.repeat(24),
              },
      }
      await act(async () => {
        post.resolve(jsonResponse(acknowledged))
        expect(await write).toBe(true)
      })
      expect(store.getState().nonogramUi.draft?.base ?? null).toEqual(acknowledged.game)
      await act(async () => {
        read.resolve(jsonResponse(prior))
        await get
      })
      expect(nonogramApi.endpoints.getNonogram.select(testUser.id)(store.getState()).data).toEqual(
        acknowledged,
      )
      expect(store.getState().nonogramUi.draft?.base ?? null).toEqual(acknowledged.game)
      expect(store.getState().nonogramUi.draft?.cells ?? null).toBe(
        acknowledged.game?.cells ?? null,
      )
    },
  )

  it('adopts newer removals/reinstalls when clean, rejects older upserts and preserves dirty marks', async () => {
    const { store } = await setup()
    const put = async (data: NonogramSnapshot) =>
      act(async () => {
        await store.dispatch(nonogramApi.util.upsertQueryData('getNonogram', testUser.id, data))
      })
    const removed = { ...initial, installationVersion: 2, game: null }
    await put(removed)
    await waitFor(() => expect(store.getState().nonogramUi.draft).toBeNull())
    await put(initial)
    expect(nonogramApi.endpoints.getNonogram.select(testUser.id)(store.getState()).data).toEqual(
      removed,
    )
    const reinstalled = {
      ...initial,
      installationVersion: 3,
      game: { ...initial.game!, version: 3, puzzleId: 'cup-5' },
    }
    await put(reinstalled)
    await waitFor(() => expect(store.getState().nonogramUi.draft!.base.version).toBe(3))
    await put(removed)
    expect(store.getState().nonogramUi.draft!.base.puzzleId).toBe('cup-5')
    fireEvent.click(cell())
    const local = store.getState().nonogramUi.draft!.cells
    await put({ ...reinstalled, installationVersion: 4, game: { ...reinstalled.game, version: 4 } })
    expect(store.getState().nonogramUi.draft!.base.version).toBe(3)
    expect(store.getState().nonogramUi.draft!.cells).toBe(local)
  })

  it.each([
    ['save', false],
    ['remove', false],
    ['save', true],
  ] as const)(
    'does not adopt an old %s receipt over a newer installation (removed: %s)',
    async (action, removed) => {
      const { store, fetch } = await setup()
      const newer: NonogramSnapshot = {
        ...initial,
        installationVersion: 4,
        game: removed
          ? null
          : { ...initial.game!, puzzleId: 'cup-5', version: 4, cells: '2' + '0'.repeat(24) },
      }
      await act(async () => {
        await store.dispatch(nonogramApi.util.upsertQueryData('getNonogram', testUser.id, newer))
      })
      fetch.mockImplementation(async (_url, init) =>
        jsonResponse(
          init?.body
            ? {
                ...initial,
                installationVersion: 2,
                game: action === 'remove' ? null : { ...initial.game!, version: 2 },
              }
            : newer,
        ),
      )
      const pending = { action, body: { version: 1, requestKey: crypto.randomUUID() } }
      act(() => {
        store.dispatch(nonogramWriteStarted(pending))
        store.dispatch(
          nonogramWriteFailed({ message: 'Lost response', conflict: false, uncertain: true }),
        )
        store.dispatch(nonogramWriteFinished())
      })
      await act(async () => {
        expect(await store.dispatch(executeNonogramWrite(pending))).toBe(true)
      })
      expect(store.getState().nonogramUi.uncertain).toBeNull()
      expect(store.getState().nonogramUi.draft?.base ?? null).toEqual(newer.game)
      expect(nonogramApi.endpoints.getNonogram.select(testUser.id)(store.getState()).data).toEqual(
        newer,
      )
    },
  )

  it('defensively retains a newer clean draft over older active and removed snapshots', async () => {
    const { store } = await setup()
    const newer = { ...initial.game!, version: 3 }
    await act(async () => {
      store.dispatch(nonogramAccepted({ ownerId: testUser.id, game: newer, reset: true }))
    })
    expect(store.getState().nonogramUi.draft!.base.version).toBe(3)
    await act(async () => {
      await store.dispatch(
        nonogramApi.util.upsertQueryData('getNonogram', testUser.id, {
          ...initial,
          installationVersion: 2,
          game: null,
        }),
      )
    })
    expect(store.getState().nonogramUi.draft!.base.version).toBe(3)
  })

  it('rejects another owner response and keeps distinct owners in distinct cache entries', async () => {
    const { store, fetch } = await setup()
    const other = { ...initial, ownerId: testUser.id + 1, installationVersion: 20 }
    await act(async () => {
      await store.dispatch(nonogramApi.util.upsertQueryData('getNonogram', other.ownerId, other))
    })
    fetch.mockResolvedValue(jsonResponse(other))
    await act(async () => {
      const result = await store.dispatch(
        nonogramApi.endpoints.getNonogram.initiate(testUser.id, {
          forceRefetch: true,
          subscribe: false,
        }),
      )
      expect(result.isError).toBe(true)
    })
    expect(nonogramApi.endpoints.getNonogram.select(testUser.id)(store.getState()).data).toEqual(
      initial,
    )
    expect(nonogramApi.endpoints.getNonogram.select(other.ownerId)(store.getState()).data).toEqual(
      other,
    )
    expect(store.getState().nonogramUi.draft!.ownerId).toBe(testUser.id)
  })
})
