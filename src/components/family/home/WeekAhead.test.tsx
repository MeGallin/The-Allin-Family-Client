vi.mock('../../../features/widgets/useWidgets', () => ({
  useWidgets: () => ({
    widgets: [],
    ownerId: 1,
    removals: {},
    loading: false,
    error: '',
    refresh: vi.fn(),
  }),
}))
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { FamilyEvent } from '../../../features/calendar/types'
import type { FamilyPollRecord } from '../../../features/polls/types'
import type { ShoppingItem } from '../../../features/shopping/types'
import type { WeekContext } from '../../../features/week-context/types'
import type { FoodAlertsFeed } from '../../../features/food-alerts/types'
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
  context: undefined as WeekContext | undefined,
  food: undefined as FoodAlertsFeed | undefined,
}))
vi.mock('../../../features/travel/useTravel', () => ({
  useTravel: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('../../../features/food-alerts/useFoodAlerts', () => ({
  useFoodAlerts: () => ({ data: state.food, isLoading: !state.food, isError: false }),
}))
vi.mock('../../../features/weather-warnings/useWeatherWarnings', () => ({
  useWeatherWarnings: () => ({
    data: {
      status: 'ready',
      updatedAt: new Date(state.now).toISOString(),
      location: 'Guildford, Surrey, United Kingdom',
      data: [],
    },
    isLoading: false,
    isError: false,
  }),
}))
// Public context has its own service lifecycle; these tests isolate family navigation.
vi.mock('../../../features/week-context/useWeekContext', () => ({
  useWeekContext: () => ({
    data: state.context,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
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
  state.context = undefined
  state.food = undefined
  vi.useFakeTimers()
  vi.setSystemTime(state.now)
})
describe('Week Ahead dashboard', () => {
  it('requires explicit valid Apply or Enter, clears reverted pending and disables after URL acceptance', async () => {
    show(<WeekPlanner />)
    const input = screen.getByLabelText(/Days to show/)
    expect((screen.getByRole('button', { name: 'Apply days' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    fireEvent.change(input, { target: { value: '14' } })
    expect(screen.getByRole('list', { name: 'Next 7 days' })).toBeTruthy()
    expect(screen.getByText('14 days selected · Apply to update')).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Apply 14 days' })
        .classList.contains('week-planner__apply--pending'),
    ).toBe(true)
    fireEvent.change(input, { target: { value: '7' } })
    expect(screen.queryByText(/selected · Apply/)).toBeNull()
    expect((screen.getByRole('button', { name: 'Apply days' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    for (const value of ['', '3', '361', '4.5']) {
      fireEvent.change(input, { target: { value } })
      expect(
        (screen.getByRole('button', { name: 'Apply days' }) as HTMLButtonElement).disabled,
      ).toBe(true)
      expect(screen.getByText('Enter a whole number from 4 to 360.')).toBeTruthy()
      fireEvent.submit(input.closest('form')!)
      expect(screen.getByRole('list', { name: 'Next 7 days' })).toBeTruthy()
    }
    fireEvent.change(input, { target: { value: '14' } })
    await act(async () => fireEvent.submit(input.closest('form')!))
    expect(screen.getByRole('list', { name: 'Next 14 days' })).toBeTruthy()
    expect(screen.getByText(/Range applied/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Apply days' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })
  it('retains today’s started plan in its tile while the next diary remains future-only', () => {
    state.now = new Date(2026, 9, 25, 13).getTime()
    const today = {
      ...event('31', 'Andie at con', new Date(2026, 9, 25, 12).toISOString()),
      allDay: false,
      detail: 'After lunch',
    }
    state.events = [today, event('30', 'Yesterday', '2026-10-24T00:00:00Z')]
    show(<WeekPlanner />)
    expect(
      screen.getByRole('button', { name: 'View 1 plan for Sunday 25 October' }).textContent,
    ).toContain('Andie at con')
    expect(
      screen.getByText('1 plan in the next 7 days · 0 upcoming in your family calendar'),
    ).toBeTruthy()
    expect(screen.getByText('A little breathing room.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'View 1 plan for Sunday 25 October' }))
    const dialog = screen.getByRole('dialog', { name: 'Plans for Sunday 25 October' })
    expect(within(dialog).getByText('After lunch')).toBeTruthy()
    expect(within(dialog).getByText('12:00')).toBeTruthy()
    expect(within(dialog).queryByText('Yesterday')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('places the food-warning badge inside today’s tile only, outside the day navigation link', () => {
    state.food = {
      status: 'ready',
      updatedAt: new Date(state.now).toISOString(),
      data: [
        {
          id: 'FSA-AA-1-2026',
          title: 'Food alert',
          publishedAt: '2026-10-21',
          kind: 'allergy',
          url: 'https://alerts.food.gov.uk/a',
        },
      ],
    }
    const view = show(<WeekPlanner />)
    const badge = screen.getByRole('button', { name: /Latest food alerts/ })
    expect(badge.closest('.week-planner__day')?.classList.contains('is-today')).toBe(true)
    expect(badge.closest('.week-planner__day-main')).toBeNull()
    expect(screen.getAllByRole('button', { name: /Latest food alerts/ })).toHaveLength(1)
    expect(view.container.querySelectorAll('.week-planner__day')).toHaveLength(7)
  })
  it('marks weekends and shows months only at the start and month boundaries', () => {
    const view = render(
      <MemoryRouter initialEntries={['/?days=45']}>
        <WeekPlanner />
      </MemoryRouter>,
    )
    const tiles = view.container.querySelectorAll('.week-planner__day')
    expect(tiles).toHaveLength(45)
    expect(tiles[0].classList.contains('is-weekend')).toBe(false)
    expect(tiles[2].classList.contains('is-weekend')).toBe(true)
    expect(tiles[3].classList.contains('is-weekend')).toBe(true)
    expect(tiles[4].classList.contains('is-weekend')).toBe(false)
    expect(
      [...view.container.querySelectorAll('.week-planner__month')].map((node) => node.textContent),
    ).toEqual(['Oct', 'Nov', 'Dec'])
    expect(tiles[10].querySelector('.week-planner__day-label')?.textContent).toBe('SunNov')
    expect(screen.getAllByText('Weekend')).toHaveLength(13)
  })
  it('changes to four days from today, then 360 days across the year boundary', async () => {
    show(<WeekPlanner />)
    const input = screen.getByLabelText(/Days to show/)
    fireEvent.change(input, { target: { value: '4' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Apply 4 days' })))
    expect(
      within(screen.getByRole('list', { name: 'Next 4 days' })).getAllByRole('link', {
        name: /\. Add a plan\.$/,
      }),
    ).toHaveLength(4)
    fireEvent.change(screen.getByLabelText(/Days to show/), { target: { value: '360' } })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Apply 360 days' })))
    const links = within(screen.getByRole('list', { name: 'Next 360 days' })).getAllByRole('link', {
      name: /\. Add a plan\.$/,
    })
    expect(links).toHaveLength(360)
    expect(links[0].getAttribute('href')).toBe('/calendar?compose=event&date=2026-10-22')
    expect(links[359].getAttribute('href')).toBe('/calendar?compose=event&date=2027-10-16')
    expect(screen.getByText(/22 Oct 2026.*16 Oct 2027/)).toBeTruthy()
  }, 15000)
  it('restores a URL range and safely falls back for an invalid range', () => {
    const view = render(
      <MemoryRouter initialEntries={['/?days=30']}>
        <WeekPlanner />
      </MemoryRouter>,
    )
    expect(
      within(screen.getByRole('list', { name: 'Next 30 days' })).getAllByRole('link', {
        name: /\. Add a plan\.$/,
      }),
    ).toHaveLength(30)
    view.unmount()
    render(
      <MemoryRouter initialEntries={['/?days=361']}>
        <WeekPlanner />
      </MemoryRouter>,
    )
    expect(
      within(screen.getByRole('list', { name: 'Next 7 days' })).getAllByRole('link', {
        name: /\. Add a plan\.$/,
      }),
    ).toHaveLength(7)
  })
  it('renders the matching bank holiday and opens weather details without navigating or adding events', () => {
    state.now = Date.parse('2026-12-24T12:00:00Z')
    vi.setSystemTime(state.now)
    state.context = {
      weather: {
        location: 'Guildford',
        timeZone: 'Europe/London',
        status: 'ready',
        updatedAt: new Date(state.now).toISOString(),
        data: [{ date: '2026-12-25', code: 61, high: 7, low: 2, rain: 80 }],
      },
      holidays: {
        region: 'England and Wales',
        status: 'ready',
        updatedAt: new Date(state.now).toISOString(),
        data: [{ date: '2026-12-25', title: 'Christmas Day' }],
      },
    }
    show(<WeekPlanner />)
    expect(
      screen
        .getByRole('link', { name: 'Friday 25 December, Christmas Day: no plans. Add a plan.' })
        .getAttribute('href'),
    ).toBe('/calendar?compose=event&date=2026-12-25')
    expect(
      screen.getByText('0 plans in the next 7 days · 0 upcoming in your family calendar'),
    ).toBeTruthy()
    expect(screen.queryByText(/Weather for Guildford/)).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: /Forecast for Friday 25 December.*high 7°C.*80%/ }),
    )
    expect(screen.getByRole('dialog', { name: 'Friday, 25 December' })).toBeTruthy()
    expect(screen.getByText('Guildford · Europe/London')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('shows seven local days, event titles without creator names, and extra-event counts', () => {
    state.events = [event('1', 'Andie at con'), event('2', 'Family lunch')]
    show(<WeekPlanner />)
    const days = screen.getByRole('list', { name: 'Next 7 days' })
    expect(within(days).getAllByRole('link', { name: /\. Add a plan\.$/ })).toHaveLength(7)
    const saturday = within(days).getByRole('link', {
      name: 'Saturday 24 October: 2 plans. Add a plan.',
    })
    expect(saturday.getAttribute('href')).toBe('/calendar?compose=event&date=2026-10-24')
    const planSummary = within(days).getByRole('button', {
      name: 'View 2 plans for Saturday 24 October',
    })
    expect(planSummary.textContent).toContain('Andie at con')
    expect(planSummary.textContent).toContain('2 plans · View all')
    expect(planSummary.textContent).not.toContain('Dad')
    expect(
      screen.getByText('2 plans in the next 7 days · 2 upcoming in your family calendar'),
    ).toBeTruthy()
  })
  it('projects annual dates and excludes the eighth day from this week', () => {
    state.events = [
      { ...event('1', 'Birthday', '2025-10-24T00:00:00Z'), annually: true },
      event('2', 'Next week', '2026-10-29T00:00:00Z'),
    ]
    show(<WeekPlanner />)
    expect(
      screen.getByRole('link', { name: 'Saturday 24 October: 1 plan. Add a plan.' }),
    ).toBeTruthy()
    expect(
      screen.getByText('1 plan in the next 7 days · 2 upcoming in your family calendar'),
    ).toBeTruthy()
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
    expect(within(section).getByRole('link').getAttribute('href')).toBe(
      '/my-space?show=open&view=family&tool=polls#poll-1',
    )
    expect(within(section).getByText('1h left')).toBeTruthy()
    state.now += 5 * 3600000
    vi.setSystemTime(state.now)
    view.rerender(
      <MemoryRouter>
        <HomePriorities />
      </MemoryRouter>,
    )
    expect(within(section).getByText('Voting closed')).toBeTruthy()
    expect(within(section).getByRole('link').getAttribute('href')).toBe(
      '/my-space?show=closed&view=family&tool=polls#poll-2',
    )
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
    expect(within(summary).getByRole('link').getAttribute('href')).toBe(
      '/my-space?show=needed&view=family&tool=shopping',
    )
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
