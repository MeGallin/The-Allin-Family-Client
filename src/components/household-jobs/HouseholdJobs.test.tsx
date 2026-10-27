import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../../features/auth/auth-slice'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import { testUser, jsonResponse } from '../../test/fixtures'
import type { HouseholdJob, JobsSnapshot } from '../../features/household-jobs/types'
import HouseholdJobs from './HouseholdJobs'
const originalHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint')
let store: ReturnType<typeof createAppStore> | undefined
const job = (id: string, title: string): HouseholdJob => ({
  id,
  title,
  ownerId: testUser.id,
  scope: 'family',
  note: '',
  area: '',
  targetDate: null,
  repeat: 'none',
  assigneeId: null,
  done: false,
  version: 1,
  history: [],
})
const baseline = (): JobsSnapshot => ({
  ownerId: testUser.id,
  jobs: [job('1', 'Wash windows'), job('2', 'Check cupboard')],
  archive: [],
  members: [{ id: testUser.id, name: 'Dad' }],
})
afterEach(() => {
  if (originalHitTest) Object.defineProperty(document, 'elementFromPoint', originalHitTest)
  else Reflect.deleteProperty(document, 'elementFromPoint')
  if (store) act(() => clearPrivateState(store!.dispatch))
  store = undefined
})
function mount(snapshot = baseline(), reject: boolean | number = false) {
  const writes: { path: string; body: Record<string, unknown> }[] = []
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const path = String(input)
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body))
      writes.push({ path, body })
      if (reject)
        return jsonResponse(
          { error: 'Could not save order' },
          typeof reject === 'number' ? reject : 500,
        )
      if (path.endsWith('/reorder'))
        snapshot = {
          ...snapshot,
          jobs: (body.ids as string[]).map((id) => snapshot.jobs.find((j) => j.id === id)!),
        }
    }
    return jsonResponse(snapshot)
  })
  store = createAppStore()
  store.dispatch(userReceived(testUser))
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <Provider store={store}>
            <DraftProtectionProvider>
              <HouseholdJobs />
            </DraftProtectionProvider>
          </Provider>
        ),
      },
    ],
    { initialEntries: ['/my-space?view=family&tool=jobs'] },
  )
  let view = render(<RouterProvider router={router} />)
  return Object.assign(writes, {
    remount: () => {
      view.unmount()
      view = render(<RouterProvider router={router} />)
    },
  })
}
it('loads optional flexible jobs and saves exactly once for a completed keyboard move', async () => {
  const writes = mount()
  const handle = await screen.findByRole('button', { name: 'Move Wash windows' })
  expect(screen.getAllByText('Flexible').length).toBe(2)
  fireEvent.keyDown(handle, { key: 'ArrowDown' })
  await waitFor(() => expect(writes).toHaveLength(1))
  await screen.findByText('Order saved.')
  expect(writes[0].body.ids).toEqual(['2', '1'])
  expect(writes[0].body.scope).toBe('family')
  const rows = screen.getAllByRole('listitem')
  expect(within(rows[0]).getByRole('button', { name: 'Check cupboard' })).toBeTruthy()
})
it('restores the previous order and reports a failed save', async () => {
  const writes = mount(baseline(), true)
  fireEvent.keyDown(await screen.findByRole('button', { name: 'Move Wash windows' }), {
    key: 'ArrowDown',
  })
  await screen.findByText(/previous order is shown/)
  expect(writes).toHaveLength(1)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
})
it('keeps target day optional, makes private scope explicit and protects a draft', async () => {
  mount({ ...baseline(), jobs: [] })
  await screen.findByText(/No open jobs/)
  fireEvent.click(screen.getByRole('button', { name: 'Mine' }))
  fireEvent.click(screen.getByRole('button', { name: 'Add job' }))
  const dialog = screen.getByRole('dialog', { name: 'Add a job' })
  expect(within(dialog).getByText('Only you can see this job and its history.')).toBeTruthy()
  const day = within(dialog).getByLabelText('Target day (optional)') as HTMLInputElement
  expect(day.value).toBe('')
  expect(day.required).toBe(false)
  fireEvent.change(within(dialog).getByLabelText('Job title'), {
    target: { value: 'A private draft' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  expect(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
  expect((screen.getByLabelText('Job title') as HTMLInputElement).value).toBe('A private draft')
})
it('blocks every move after accepted response loss until a successful GET, including remount', async () => {
  const snapshot = baseline()
  snapshot.jobs.push(
    job('3', 'Clean shelf'),
    { ...job('4', 'Private chore'), scope: 'mine' },
    { ...job('5', 'Private plan'), scope: 'mine' },
  )
  const writes = mount(snapshot)
  await screen.findByRole('button', { name: 'Move Wash windows' })
  let server = snapshot
  let rejectGet = true
  let responseLost = true
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body))
      writes.push({ path: String(input), body })
      if (String(input).endsWith('/reorder')) {
        const ids = body.ids as string[]
        const scope = body.scope
        server = {
          ...server,
          jobs: [
            ...ids.map((id) => server.jobs.find((j) => j.id === id)!),
            ...server.jobs.filter((j) => j.scope !== scope),
          ],
        }
        if (responseLost) throw new Error('Response lost after server commit')
      }
      return jsonResponse(server)
    }
    if (rejectGet) return jsonResponse({ error: 'Refresh unavailable' }, 503)
    return jsonResponse(server)
  })
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move Wash windows' }), { key: 'ArrowDown' })
  await screen.findByText(/previous order is shown/)
  const blocked = screen.getByRole('button', { name: 'Move Wash windows' }) as HTMLButtonElement
  expect(blocked.disabled).toBe(true)
  fireEvent.keyDown(blocked, { key: 'ArrowDown' })
  fireEvent.pointerDown(blocked, { pointerId: 1, button: 0 })
  fireEvent.pointerUp(blocked, { pointerId: 1 })
  expect(writes).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Wash windows' }))
  const detail = screen.getByRole('dialog', { name: 'Wash windows' })
  expect(
    (within(detail).getByRole('button', { name: 'Move down' }) as HTMLButtonElement).disabled,
  ).toBe(true)
  fireEvent.click(within(detail).getByRole('button', { name: 'Move down' }))
  fireEvent.click(within(detail).getByRole('button', { name: 'Close' }))
  expect(writes).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Refresh jobs' }))
  await screen.findByText(/Refresh unavailable/)
  expect(
    (screen.getByRole('button', { name: 'Move Wash windows' }) as HTMLButtonElement).disabled,
  ).toBe(true)
  // Another scope has an independent order and is not locked by Family recovery.
  fireEvent.click(screen.getByRole('button', { name: 'Mine' }))
  expect(
    (screen.getByRole('button', { name: 'Move Private chore' }) as HTMLButtonElement).disabled,
  ).toBe(false)
  responseLost = false
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move Private chore' }), {
    key: 'ArrowDown',
  })
  await screen.findByText('Order saved.')
  expect(writes).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Family' }))
  expect(
    (screen.getByRole('button', { name: 'Move Wash windows' }) as HTMLButtonElement).disabled,
  ).toBe(true)
  writes.remount()
  await screen.findByText(/Refresh unavailable/)
  expect(
    (screen.getByRole('button', { name: 'Move Wash windows' }) as HTMLButtonElement).disabled,
  ).toBe(true)
  rejectGet = false
  responseLost = false
  fireEvent.click(screen.getByRole('button', { name: 'Refresh jobs' }))
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Move Wash windows' }) as HTMLButtonElement).disabled,
    ).toBe(false),
  )
  const rows = screen.getAllByRole('listitem')
  expect(within(rows[0]).getByRole('button', { name: 'Check cupboard' })).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move Wash windows' }), { key: 'ArrowDown' })
  await waitFor(() => expect(writes).toHaveLength(3))
  expect(writes[2].body.ids).toEqual(['2', '3', '1'])
})

it('keeps boundary no-ops and definitive rejection rollback available without an ambiguity guard', async () => {
  const writes = mount(baseline(), 422)
  const grip = await screen.findByRole('button', { name: 'Move Wash windows' })
  fireEvent.keyDown(grip, { key: 'ArrowUp' })
  expect(writes).toHaveLength(0)
  fireEvent.keyDown(grip, { key: 'ArrowDown' })
  await screen.findByText(/Could not save order/)
  expect(
    (screen.getByRole('button', { name: 'Move Wash windows' }) as HTMLButtonElement).disabled,
  ).toBe(false)
  expect(store!.getState().jobsUi.orderNeedsRefresh.family).toBe(false)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
})

it('saves a non-empty native date input event on create and edit and renders the saved target', async () => {
  let snapshot: JobsSnapshot = { ...baseline(), jobs: [] }
  const writes = mount(snapshot)
  await screen.findByText(/No open jobs/)
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body))
      writes.push({ path: String(input), body })
      if (String(input).endsWith('/add'))
        snapshot = { ...snapshot, jobs: [{ ...job('8', String(body.title)), ...body }] }
      if (String(input).endsWith('/edit'))
        snapshot = {
          ...snapshot,
          jobs: snapshot.jobs.map((j) =>
            j.id === body.id ? { ...j, ...body, version: j.version + 1 } : j,
          ),
        }
    }
    return jsonResponse(snapshot)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add job' }))
  let dialog = screen.getByRole('dialog', { name: 'Add a job' })
  fireEvent.change(within(dialog).getByLabelText('Job title'), {
    target: { value: 'Date regression' },
  })
  const day = within(dialog).getByLabelText('Target day (optional)') as HTMLInputElement
  // Native date pickers/input automation can deliver input before a change/blur event.
  day.value = '2026-10-29'
  fireEvent.input(day)
  expect(day.value).toBe('2026-10-29')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save job' }))
  await screen.findByRole('button', { name: 'Date regression' })
  expect(writes[0].body.targetDate).toBe('2026-10-29')
  expect(screen.getByText('Target 29 Oct 2026')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Date regression' }))
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Date regression' })).getByRole('button', {
      name: 'Edit / assign',
    }),
  )
  dialog = screen.getByRole('dialog', { name: 'Edit job' })
  const editedDay = within(dialog).getByLabelText('Target day (optional)') as HTMLInputElement
  editedDay.value = '2026-11-02'
  fireEvent.input(editedDay)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save job' }))
  await screen.findByText('Target 2 Nov 2026')
  expect(writes[1].body.targetDate).toBe('2026-11-02')
  writes.remount()
  await screen.findByText('Target 2 Nov 2026')
  fireEvent.click(screen.getByRole('button', { name: 'Date regression' }))
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Date regression' })).getByRole('button', {
      name: 'Edit / assign',
    }),
  )
  dialog = screen.getByRole('dialog', { name: 'Edit job' })
  const clearedDay = within(dialog).getByLabelText('Target day (optional)') as HTMLInputElement
  clearedDay.value = ''
  fireEvent.input(clearedDay)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save job' }))
  await screen.findByText('Flexible')
  expect(writes[2].body.targetDate).toBe(null)
})

function pointer(target: Element, type: string, x: number, y: number, pointerId = 7) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  fireEvent(target, event)
}
it('captures on the stable list and persists once after cross-card pointer preview and release', async () => {
  const snapshot = baseline()
  snapshot.jobs.push(job('3', 'Clean shelf'))
  const writes = mount(snapshot)
  const grip = await screen.findByRole('button', { name: 'Move Wash windows' })
  const list = screen.getByRole('list', { name: 'Shared household jobs' })
  Object.defineProperty(list, 'hasPointerCapture', { configurable: true, value: () => false })
  const capture = vi.fn()
  Object.defineProperty(list, 'hasPointerCapture', { configurable: true, value: () => false })
  Object.defineProperty(list, 'setPointerCapture', { configurable: true, value: capture })
  Object.defineProperty(grip, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => screen.getByRole('button', { name: 'Clean shelf' })),
  })
  pointer(grip, 'pointerdown', 69, 155)
  expect(capture).toHaveBeenCalledWith(7)
  pointer(list, 'pointermove', 200, 550)
  expect(writes).toHaveLength(0)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Check cupboard' }),
  ).toBeTruthy()
  pointer(list, 'pointerup', 200, 550)
  await screen.findByText('Order saved.')
  expect(writes).toHaveLength(1)
  expect(writes[0].body.ids).toEqual(['2', '3', '1'])
  pointer(list, 'lostpointercapture', 200, 550)
  expect(screen.queryByText('Move cancelled.')).toBe(null)
  writes.remount()
  await screen.findByRole('button', { name: 'Move Wash windows' })
  expect(
    within(screen.getAllByRole('listitem')[2]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
})
it('cancels a captured pointer preview without saving and ignores another pointer', async () => {
  const writes = mount()
  const grip = await screen.findByRole('button', { name: 'Move Wash windows' })
  const list = screen.getByRole('list', { name: 'Shared household jobs' })
  Object.defineProperty(list, 'hasPointerCapture', { configurable: true, value: () => false })
  Object.defineProperty(list, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(grip, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => screen.getByRole('button', { name: 'Check cupboard' })),
  })
  pointer(grip, 'pointerdown', 69, 155)
  pointer(list, 'pointermove', 200, 550, 8)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
  pointer(list, 'pointermove', 200, 550)
  pointer(list, 'pointercancel', 200, 550)
  expect(screen.getByText('Move cancelled.')).toBeTruthy()
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
  pointer(list, 'pointerup', 200, 550)
  expect(writes).toHaveLength(0)
  pointer(grip, 'pointerdown', 69, 155)
  pointer(list, 'pointermove', 200, 550)
  pointer(list, 'lostpointercapture', 200, 550)
  pointer(list, 'pointerup', 200, 550)
  expect(writes).toHaveLength(0)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
  pointer(grip, 'pointerdown', 69, 155)
  pointer(list, 'pointerup', 69, 155)
  expect(writes).toHaveLength(0)
  expect(screen.getByText('Order unchanged.')).toBeTruthy()
})
it('rolls back a drag preview if going offline prevents the release from saving', async () => {
  const writes = mount()
  const grip = await screen.findByRole('button', { name: 'Move Wash windows' })
  const list = screen.getByRole('list', { name: 'Shared household jobs' })
  Object.defineProperty(list, 'setPointerCapture', { configurable: true, value: vi.fn() })
  Object.defineProperty(list, 'hasPointerCapture', { configurable: true, value: () => false })
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => screen.getByRole('button', { name: 'Check cupboard' }),
  })
  pointer(grip, 'pointerdown', 69, 155)
  pointer(list, 'pointermove', 200, 350)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Check cupboard' }),
  ).toBeTruthy()
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  fireEvent(window, new Event('offline'))
  pointer(list, 'pointerup', 200, 350)
  expect(writes).toHaveLength(0)
  expect(
    within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Wash windows' }),
  ).toBeTruthy()
  expect(screen.getByText(/Move cancelled/)).toBeTruthy()
})
