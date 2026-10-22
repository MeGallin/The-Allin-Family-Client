import { afterEach, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { testUser } from '../../test/fixtures'
import { pollsApi } from '../../services/polls-query'
import { PollsSync } from './PollsSync'
import type { FamilyPollRecord } from './types'
let store: ReturnType<typeof createAppStore> | undefined
const poll = (now: number): FamilyPollRecord => ({
  id: '1',
  title: 'Isolated deadline',
  detail: '',
  closed: false,
  closesAt: new Date(now + 2000).toISOString(),
  version: 1,
  options: [],
  totalVotes: 0,
  ownOptionId: null,
  voteVersion: 0,
  createdBy: { id: testUser.id, displayName: 'Owner' },
  updatedBy: { id: testUser.id, displayName: 'Owner' },
  createdAt: new Date(now).toISOString(),
  updatedAt: new Date(now).toISOString(),
})
afterEach(() => {
  if (store) clearPrivateState(store.dispatch)
})
it('closes the cached poll at its boundary without a network refresh or per-card timer', async () => {
  store = createAppStore()
  store.dispatch(userReceived(testUser))
  const now = Date.now()
  await store.dispatch(pollsApi.util.upsertQueryData('getPolls', undefined, { polls: [poll(now)] }))
  vi.useFakeTimers()
  vi.setSystemTime(now)
  function State() {
    const { data } = pollsApi.endpoints.getPolls.useQueryState(undefined)
    return <output>{data?.polls[0].closed ? 'Closed' : 'Open'}</output>
  }
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/profile']}>
        <PollsSync onSessionExpired={vi.fn()} />
        <State />
      </MemoryRouter>
    </Provider>,
  )
  act(() => {
    vi.advanceTimersByTime(1999)
  })
  expect(screen.getByText('Open')).toBeTruthy()
  act(() => {
    vi.advanceTimersByTime(1)
  })
  expect(
    pollsApi.endpoints.getPolls.select(undefined)(store.getState()).data?.polls[0].closed,
  ).toBe(true)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20)
  })
  expect(screen.getByText('Closed')).toBeTruthy()
  expect(fetch).not.toHaveBeenCalled()
})
