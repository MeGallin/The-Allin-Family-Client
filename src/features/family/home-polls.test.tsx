import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { testUser } from '../../test/fixtures'
import type { FamilyPollRecord } from '../polls/types'
import { pollsApi } from '../../services/polls-query'
import { PollsSync } from '../polls/PollsSync'
import { HomeOverview } from '../../components/family/HomeOverview'
import { FamilyPoll } from '../../components/family/polls/FamilyPoll'
import { homePolls } from './home-view'
import { pollTimeLeft } from '../polls/poll-deadline'
const base = Date.parse('2026-10-22T12:00:00Z')
function poll(id: string, delay: number, ownOptionId: string | null = null): FamilyPollRecord {
  return {
    id,
    title: 'Question ' + id,
    detail: '',
    closed: false,
    closesAt: new Date(base + delay).toISOString(),
    version: 1,
    options: [
      { id: 'a', label: 'A', votes: 0 },
      { id: 'b', label: 'B', votes: 0 },
    ],
    totalVotes: 0,
    ownOptionId,
    voteVersion: 0,
    createdBy: { id: testUser.id, displayName: 'Owner' },
    updatedBy: { id: testUser.id, displayName: 'Owner' },
    createdAt: new Date(base + Number(id)).toISOString(),
    updatedAt: new Date(base).toISOString(),
  }
}
let store: ReturnType<typeof createAppStore> | undefined
afterEach(() => {
  if (store) clearPrivateState(store.dispatch)
  store = undefined
})
describe('Home live poll summaries', () => {
  it('separates stable featured question from nearest deadline and excludes expired/closed questions', () => {
    const data = [
      poll('1', 1000),
      poll('2', 5000, 'a'),
      poll('3', -1),
      { ...poll('4', 9000), closed: true },
    ]
    const snapshot = JSON.stringify(data)
    const result = homePolls(data, base)
    expect(result.open.map((p) => p.id)).toEqual(['2', '1'])
    expect(result.featured?.id).toBe('2')
    expect(result.nextClosing?.id).toBe('1')
    expect(result.awaitingVote).toBe(1)
    expect(homePolls(data, base + 1000).open.map((p) => p.id)).toEqual(['2'])
    expect(homePolls([], base).nextClosing).toBeUndefined()
    expect(JSON.stringify(data)).toBe(snapshot)
  })
  it('keeps compact and accessible countdowns on the same rounding boundaries', () => {
    const at = (delta: number) => new Date(base + delta).toISOString()
    expect(pollTimeLeft(at(0), base)).toBe('Voting closed')
    expect(pollTimeLeft(at(59999), base)).toBe('Less than a minute left')
    expect(pollTimeLeft(at(60000), base)).toBe('1m left')
    expect(pollTimeLeft(at(60001), base)).toBe('2m left')
    expect(pollTimeLeft(at(60001), base, 'long')).toBe('2 minutes left')
    expect(pollTimeLeft(at(85 * 60000), base)).toBe('1h 25m left')
    expect(pollTimeLeft(at(85 * 60000), base, 'long')).toBe('1 hour and 25 minutes left')
    expect(pollTimeLeft(at(2 * 86400000 + 3600000), base)).toBe('2d 1h left')
    expect(pollTimeLeft('bad', base)).toBe('Time unavailable')
  })
  it('updates count, next link, vote reminder and live marker at expiry without fetching', async () => {
    store = createAppStore()
    store.dispatch(userReceived(testUser))
    await store.dispatch(
      pollsApi.util.upsertQueryData('getPolls', undefined, {
        polls: [poll('1', 2000), poll('2', 5000, 'a')],
      }),
    )
    vi.useFakeTimers()
    vi.setSystemTime(base)
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/profile']}>
          <PollsSync onSessionExpired={vi.fn()} />
          <HomeOverview />
          <FamilyPoll />
        </MemoryRouter>
      </Provider>,
    )
    expect(screen.getByText('2 polls open')).toBeTruthy()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Withdraw my vote' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Question 2' }).getAttribute('href')).toBe(
      '/my-space?show=open&view=family&tool=polls#poll-2',
    )
    expect(screen.getByText('1 question needs your vote.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Next closes.*Question 1/ }).getAttribute('href')).toBe(
      '/my-space?show=open&view=family&tool=polls#poll-1',
    )
    expect(screen.getByRole('link', { name: 'View polls' }).getAttribute('href')).toBe(
      '/my-space?show=open&view=family&tool=polls#poll-2',
    )
    expect(screen.getByRole('link', { name: /2\s*Live polls/ }).getAttribute('href')).toBe(
      '/my-space?view=family&tool=polls',
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2020)
    })
    expect(screen.getByText('1 poll open')).toBeTruthy()
    expect(screen.getByText('You’re up to date. Your votes are saved.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Next closes.*Question 2/ }).getAttribute('href')).toBe(
      '/my-space?show=open&view=family&tool=polls#poll-2',
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(screen.getByText('No open polls right now.')).toBeTruthy()
    expect(screen.queryByText('1 poll open')).toBeNull()
    expect(screen.getByRole('link', { name: /0\s*Open polls/ })).toBeTruthy()
    expect(screen.getByText('Latest result · voting closed')).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })
})
