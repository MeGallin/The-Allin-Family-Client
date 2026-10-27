import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { createAppStore } from '../../../app/store'
import { clearPrivateState } from '../../../app/session-actions'
import { userReceived } from '../../../features/auth/auth-slice'
import { jobsApi } from '../../../services/household-jobs-query'
import type { HouseholdJob, JobsSnapshot } from '../../../features/household-jobs/types'
import { jsonResponse, testUser } from '../../../test/fixtures'
import { HomeJobsSummary } from './HomeJobsSummary'
vi.mock('../../../hooks/useNow', () => ({ useNow: () => Date.parse('2026-10-27T12:00:00Z') }))
let store: ReturnType<typeof createAppStore> | undefined
const job = (id: string, extra: Partial<HouseholdJob> = {}): HouseholdJob => ({
  id,
  title: 'Shared ' + id,
  ownerId: 101,
  scope: 'family',
  note: '',
  area: '',
  targetDate: null,
  repeat: 'none',
  assigneeId: null,
  done: false,
  version: 1,
  history: [],
  ...extra,
})
const completion = (id: string, date: string, action = 'complete') => ({
  id,
  action,
  targetDate: null,
  actor: { id: 101, name: 'Dad' },
  occurredAt: date,
})
const data = (jobs: HouseholdJob[] = [], archive: HouseholdJob[] = []): JobsSnapshot => ({
  ownerId: testUser.id,
  jobs,
  archive,
  members: [],
})
afterEach(() => {
  if (store) act(() => clearPrivateState(store!.dispatch))
  store = undefined
})
function mount(snapshot: JobsSnapshot | Promise<JobsSnapshot>, status = 200) {
  vi.mocked(fetch).mockImplementation(async () => jsonResponse(await snapshot, status))
  store = createAppStore()
  store.dispatch(userReceived(testUser))
  render(
    <Provider store={store}>
      <MemoryRouter>
        <HomeJobsSummary />
      </MemoryRouter>
    </Provider>,
  )
}
it('shows Family-only counts, retained weekly completions and earliest upcoming open target', async () => {
  mount(
    data(
      [
        job('past', { targetDate: '2026-10-20' }),
        job('later', { targetDate: '2026-11-03' }),
        job('today', { targetDate: '2026-10-27' }),
        job('done', { done: true, history: [completion('1', '2026-10-26T10:00:00Z')] }),
        job('private', {
          scope: 'mine',
          title: 'Never display private title',
          targetDate: '2026-10-27',
          history: [completion('2', '2026-10-27T09:00:00Z')],
        }),
      ],
      [
        job('archived', {
          history: [
            completion('3', '2026-10-27T10:00:00Z'),
            completion('4', '2026-10-25T10:00:00Z'),
          ],
        }),
        job('private-history', {
          scope: 'mine',
          history: [completion('5', '2026-10-27T10:00:00Z')],
        }),
      ],
    ),
  )
  expect(await screen.findByText('3 open · 1 planned today · 2 done this week')).toBeTruthy()
  expect(screen.getByText('Next target: Shared today · 27 Oct')).toBeTruthy()
  expect(screen.queryByText(/Never display private title/)).toBe(null)
  expect(screen.getAllByRole('link')).toHaveLength(1)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/my-space?view=family&tool=jobs')
  expect(fetch).toHaveBeenCalledTimes(1)
  await store!.dispatch(jobsApi.endpoints.getJobs.initiate(testUser.id, { subscribe: false }))
  expect(fetch).toHaveBeenCalledTimes(1)
})
it('keeps flexible and empty states clear without overdue language or private counts', async () => {
  mount(
    data([job('flex'), job('past', { targetDate: '2026-10-20' }), job('mine', { scope: 'mine' })]),
  )
  expect(await screen.findByText('2 open · 0 planned today · 0 done this week')).toBeTruthy()
  expect(screen.getByText('Flexible planning · No upcoming target day')).toBeTruthy()
  expect(screen.queryByText(/overdue/i)).toBe(null)
})
it('excludes reopened occurrences and respects London Monday week boundaries', async () => {
  mount(
    data([
      job('repeat', {
        history: [
          completion('3', '2026-10-27T10:00:00Z', 'reopen'),
          completion('2', '2026-10-26T10:00:00Z'),
          completion('1', '2026-10-25T23:59:59Z'),
        ],
      }),
    ]),
  )
  expect(await screen.findByText('1 open · 0 planned today · 0 done this week')).toBeTruthy()
})
it('does not show misleading zero counts while loading or on failure', async () => {
  let release!: (value: JobsSnapshot) => void
  mount(
    new Promise((resolve) => {
      release = resolve
    }),
  )
  expect(screen.getByText('Loading family jobs…')).toBeTruthy()
  expect(screen.queryByText(/0 open/)).toBe(null)
  await act(async () => release(data()))
  expect(await screen.findByText('0 open · 0 planned today · 0 done this week')).toBeTruthy()
  expect(screen.getByText('No open family jobs')).toBeTruthy()
})
it('shows failure and retry without misleading private or zero counts', async () => {
  mount(data(), 503)
  expect(await screen.findByText('Jobs summary unavailable')).toBeTruthy()
  expect(screen.queryByText(/0 open/)).toBe(null)
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
  vi.mocked(fetch).mockResolvedValue(jsonResponse(data()))
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByText('No open family jobs')
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
})

it('offers no retry for an unstarted offline query and starts safely on reconnect', async () => {
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  mount(data(), 503)
  expect(screen.getByText('You’re offline. Reconnect to refresh family jobs.')).toBeTruthy()
  expect(screen.getByText('Jobs summary unavailable')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Try again' })).toBe(null)
  expect(fetch).not.toHaveBeenCalled()
  online.mockReturnValue(true)
  fireEvent(window, new Event('online'))
  expect(await screen.findByRole('button', { name: 'Try again' })).toBeTruthy()
  expect(fetch).toHaveBeenCalledTimes(1)
  vi.mocked(fetch).mockResolvedValue(jsonResponse(data()))
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByText('No open family jobs')
  expect(fetch).toHaveBeenCalledTimes(2)
})
