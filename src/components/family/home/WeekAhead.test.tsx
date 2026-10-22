import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { FamilyEvent } from '../../../features/calendar/types'
import type { FamilyPollRecord } from '../../../features/polls/types'
import type { ShoppingItem } from '../../../features/shopping/types'
import { WeekPlanner } from './WeekPlanner'
import { HomePriorities } from './HomePriorities'
import { HomeDestinations } from './HomeDestinations'

const state = vi.hoisted(() => ({
  now: Date.parse('2026-10-22T12:00:00Z'),
  events: [] as FamilyEvent[],
  polls: [] as FamilyPollRecord[],
  items: [] as ShoppingItem[],
  loading: false,
  error: '',
  retry: vi.fn(),
}))
vi.mock('../../../hooks/useNow', () => ({ useNow: () => state.now }))
vi.mock('../../../features/calendar/useCalendar', () => ({
  useCalendar: () => ({
    events: state.events,
    loading: state.loading,
    error: state.error,
    refresh: state.retry,
  }),
}))
vi.mock('../../../features/polls/usePolls', () => ({
  usePolls: () => ({
    polls: state.polls,
    loading: state.loading,
    error: state.error,
    refresh: state.retry,
  }),
}))
vi.mock('../../../features/shopping/useShopping', () => ({
  useShopping: () => ({
    items: state.items,
    loading: state.loading,
    error: state.error,
    refresh: state.retry,
  }),
}))
vi.mock('../../../features/memories/useMemories', () => ({
  useMemories: () => ({
    memories: [],
    loading: state.loading,
    error: state.error,
    refresh: state.retry,
  }),
}))
const actor = { id: 1, displayName: 'Dad' }
function event(id: string, title: string, startsAt = '2026-10-24T00:00:00Z'): FamilyEvent {
  return {
    id,
    title,
    startsAt,
    allDay: true,
    annually: false,
    timeZone: 'Europe/London',
    detail: '',
    version: 1,
    createdBy: actor,
    updatedBy: actor,
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z',
  }
}
function poll(id: string, hours: number): FamilyPollRecord {
  return {
    id,
    title: 'Question ' + id,
    detail: '',
    closed: false,
    closesAt: new Date(state.now + hours * 3600000).toISOString(),
    version: 1,
    options: [],
    totalVotes: 0,
    ownOptionId: null,
    voteVersion: 0,
    createdBy: actor,
    updatedBy: actor,
    createdAt: new Date(state.now + Number(id)).toISOString(),
    updatedAt: new Date(state.now).toISOString(),
  }
}
function show(element: React.ReactNode) {
  return render(<MemoryRouter>{element}</MemoryRouter>)
}
beforeEach(() => {
  state.now = Date.parse('2026-10-22T12:00:00Z')
  state.events = []
  state.polls = []
  state.items = []
  state.loading = false
  state.error = ''
  vi.useFakeTimers()
  vi.setSystemTime(state.now)
})
describe('Week Ahead dashboard', () => {
  it('shows seven local days, event titles without creator names, and extra-event counts', () => {
    state.events = [event('1', 'Andie at con'), event('2', 'Family lunch')]
    show(<WeekPlanner />)
    const days = screen.getByRole('list', { name: 'Next seven days' })
    expect(within(days).getAllByRole('link')).toHaveLength(7)
    const saturday = within(days).getByRole('link', {
      name: 'Saturday 24 October: Andie at con; Family lunch',
    })
    expect(saturday.getAttribute('href')).toBe('/calendar')
    expect(saturday.textContent).toContain('Andie at con')
    expect(saturday.textContent).toContain('+1 more')
    expect(saturday.textContent).not.toContain('Dad')
    expect(screen.getByText('2 plans this week · 2 upcoming in your family calendar')).toBeTruthy()
  })
  it('projects annual dates and excludes the eighth day from this week', () => {
    state.events = [
      { ...event('1', 'Birthday', '2025-10-24T00:00:00Z'), annually: true },
      event('2', 'Next week', '2026-10-29T00:00:00Z'),
    ]
    show(<WeekPlanner />)
    expect(screen.getByRole('link', { name: 'Saturday 24 October: Birthday' })).toBeTruthy()
    expect(screen.getByText('1 plan this week · 2 upcoming in your family calendar')).toBeTruthy()
  })
  it('uses explicit loading/error states, supports retry and avoids misleading empty counts', () => {
    state.loading = true
    const view = show(<WeekPlanner />)
    expect(screen.getByText('Loading family plans…')).toBeTruthy()
    state.loading = false
    state.error = 'Connection unavailable'
    view.rerender(
      <MemoryRouter>
        <WeekPlanner />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert').textContent).toContain('Connection unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.retry).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/0 upcoming/)).toBeNull()
    expect(screen.queryByText('A little breathing room.')).toBeNull()
  })
  it('pairs the soonest poll with its deadline and switches to results when voting expires', () => {
    state.polls = [poll('1', 1), poll('2', 4)]
    const view = show(<HomePriorities />)
    const section = screen.getByRole('region', { name: 'Family polls' })
    expect(within(section).getByText('2 live polls')).toBeTruthy()
    expect(within(section).getByRole('link').getAttribute('href')).toBe('/polls?show=open#poll-1')
    expect(within(section).getByText('1h left')).toBeTruthy()
    state.now += 5 * 3600000
    vi.setSystemTime(state.now)
    view.rerender(
      <MemoryRouter>
        <HomePriorities />
      </MemoryRouter>,
    )
    expect(within(section).getByText('Voting closed')).toBeTruthy()
    expect(within(section).getByRole('link').getAttribute('href')).toBe('/polls?show=closed#poll-2')
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('counts only needed shopping and needed important items, without inline actions', () => {
    const item: ShoppingItem = {
      id: '1',
      title: 'Milk',
      checked: false,
      important: true,
      version: 1,
      createdBy: actor,
      updatedBy: actor,
      createdAt: '',
      updatedAt: '',
    }
    state.items = [
      item,
      { ...item, id: '2', checked: true },
      { ...item, id: '3', important: false },
    ]
    show(<HomePriorities />)
    const summary = screen.getByRole('region', { name: 'Shopping summary' })
    expect(within(summary).getByText('2')).toBeTruthy()
    expect(within(summary).getByText('1 important')).toBeTruthy()
    expect(within(summary).getByRole('link').getAttribute('href')).toBe('/lists?show=needed')
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('keeps personal notes as a private destination without fetching their content', () => {
    show(<HomeDestinations name="Dad" />)
    expect(screen.getByRole('link', { name: /Dad’s personal notes/ }).getAttribute('href')).toBe(
      '/notes',
    )
    expect(
      screen.getByRole('link', { name: /Room for your next memory/ }).getAttribute('href'),
    ).toBe('/memories')
    expect(fetch).not.toHaveBeenCalled()
  })
})
