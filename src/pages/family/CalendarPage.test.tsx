import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FamilyEvent } from '../../features/calendar/types'
import type { PendingRemoval } from '../../features/removals/removals-slice'
import CalendarPage from './CalendarPage'
import { CalendarDayTile } from '../../components/family/home/CalendarDayTile'

const state = vi.hoisted(() => ({
  events: [] as FamilyEvent[],
  now: Date.parse('2026-10-25T13:00:00Z'),
  pending: false,
  error: '',
  removals: {} as Record<string, PendingRemoval>,
}))
vi.mock('../../features/calendar/useCalendar', () => ({
  useCalendar: () => ({ ...state, loading: false, activity: [], feedback: '', refresh: vi.fn() }),
}))
vi.mock('../../hooks/useNow', () => ({ useNow: () => state.now }))
vi.mock('../../features/removals/useRemovals', () => ({
  useRemovals: () => ({ removals: state.removals }),
}))
vi.mock('../../components/family/calendar/CalendarActivity', () => ({
  CalendarActivity: () => null,
}))
vi.mock('../../components/family/calendar/EventComposer', () => ({
  default: ({ event }: { event?: FamilyEvent }) => (
    <div role="dialog" aria-label="Explicit edit fixture">
      Editing {event?.id ?? 'new'}
    </div>
  ),
}))
const actor = { id: 101, displayName: 'Synthetic owner' }
function event(id: string, startsAt: string, title = 'Same title', annually = false): FamilyEvent {
  return {
    id,
    startsAt,
    title,
    annually,
    allDay: annually,
    timeZone: 'Europe/London',
    detail: 'Note ' + id,
    version: 1,
    createdBy: actor,
    updatedBy: actor,
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
  }
}
function mount(url = '/calendar') {
  const router = createMemoryRouter(
    [
      { path: '/calendar', element: <CalendarPage /> },
      {
        path: '/',
        element: (
          <CalendarDayTile
            date={new Date(2026, 9, 25)}
            calendarHref="/calendar?compose=event&date=2026-10-25"
            isToday
            plans={state.events.filter((e) => e.startsAt.startsWith('2026-10-25'))}
            plansUnavailable={false}
            forecast={null}
            indicators={[]}
          />
        ),
      },
    ],
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}
beforeEach(() => {
  state.events = [
    event('31', '2026-10-25T12:00:00Z'),
    event('32', '2026-10-25T12:00:00Z'),
    event('30', '2026-10-24T12:00:00Z'),
    event('40', '2026-10-26T12:00:00Z', 'Future'),
  ]
  state.pending = false
  state.error = ''
  state.removals = {}
})
describe('Calendar successful groups and exact read-only event selection', () => {
  it('explains an off-filter exact selection and clears back to normal results', () => {
    const router = mount('/calendar?q=Future&event=31&occurrence=2026-10-25')
    const dialog = screen.getByRole('dialog', { name: 'Same title' })
    expect(within(dialog).getByText(/outside the current results/)).toBeTruthy()
    expect(document.querySelectorAll('.event-row')).toHaveLength(1)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Open calendar' }))
    expect(router.state.location.search).toBe('')
    expect(document.querySelectorAll('.event-row')).toHaveLength(4)
  })
  it('leads with all today matches, keeps duplicate records and suppresses empty subgroup failure', () => {
    mount('/calendar?q=Same+title')
    expect(
      within(screen.getByRole('region', { name: 'Today' })).getAllByRole('listitem'),
    ).toHaveLength(2)
    expect(
      within(screen.getByRole('region', { name: 'Earlier plans' })).getAllByRole('listitem'),
    ).toHaveLength(1)
    expect(screen.queryByRole('region', { name: 'Coming up' })).toBeNull()
    expect(screen.queryByText(/No matching upcoming/)).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Reset view' })).toHaveLength(1)
    expect(document.querySelectorAll('.event-row')).toHaveLength(3)
  })
  it('shows one overall no-results state and a working reset', () => {
    const router = mount('/calendar?q=not-present&sort=name')
    expect(screen.getAllByText('No matching events')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(router.state.location.search).toBe('?sort=name')
    expect(screen.getByRole('region', { name: 'Today' })).toBeTruthy()
  })
  it('opens the exact same-title ID read-only on direct refresh and only edits explicitly', async () => {
    mount('/calendar?event=32&occurrence=2026-10-25')
    const dialog = screen.getByRole('dialog', { name: 'Same title' })
    expect(within(dialog).getByText('Note 32')).toBeTruthy()
    expect(within(dialog).queryByText('Note 31')).toBeNull()
    expect(screen.queryByRole('dialog', { name: 'Explicit edit fixture' })).toBeNull()
    expect(document.querySelectorAll('.event-row[aria-current="true"]')).toHaveLength(1)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit this event' }))
    expect(await screen.findByRole('dialog', { name: 'Explicit edit fixture' })).toHaveProperty(
      'textContent',
      'Editing 32',
    )
    expect(fetch).not.toHaveBeenCalled()
  })
  it('restores Home range and original day dialog on Back from the selected event', async () => {
    const router = mount('/?days=14')
    fireEvent.click(screen.getByRole('button', { name: 'View 2 plans for Sunday 25 October' }))
    expect(router.state.location.search).toBe('?days=14&plans=2026-10-25')
    const home = screen.getByRole('dialog', { name: 'Plans for Sunday 25 October' })
    fireEvent.click(within(home).getAllByRole('link', { name: 'Open Same title in calendar' })[1])
    expect(router.state.location.search).toBe('?event=32&occurrence=2026-10-25')
    expect(screen.getByRole('dialog', { name: 'Same title' })).toBeTruthy()
    await act(() => router.navigate(-1))
    expect(router.state.location.search).toBe('?days=14&plans=2026-10-25')
    expect(screen.getByRole('dialog', { name: 'Plans for Sunday 25 October' })).toBeTruthy()
  })
  it('keeps requested annual occurrence distinct from the next projected row', () => {
    state.events = [event('9', '2020-10-25T00:00:00Z', 'Annual date', true)]
    mount('/calendar?event=9&occurrence=2025-10-25')
    expect(within(screen.getByRole('dialog')).getByText(/Saturday 25 October 2025/)).toBeTruthy()
    expect(document.querySelectorAll('.event-row[aria-current="true"]')).toHaveLength(0)
  })
  it('reveals a selected matched record beyond the initial collection window', () => {
    state.events = Array.from({ length: 30 }, (_, i) =>
      event(String(i + 1), '2026-10-25T12:00:00Z'),
    )
    mount('/calendar?event=30&occurrence=2026-10-25')
    expect(document.querySelector('.event-row[aria-current="true"]')!.textContent).toContain(
      'Note 30',
    )
    expect(within(screen.getByRole('dialog')).getByText('Note 30')).toBeTruthy()
  })
  it.each(['missing', 'invalid'])(
    'explains %s targets with a Calendar fallback and no edit',
    (kind) => {
      const router = mount(
        '/calendar?event=' + (kind === 'missing' ? '999' : 'bad') + '&occurrence=2026-10-25',
      )
      const dialog = screen.getByRole('dialog')
      expect(
        within(dialog).getByText(kind === 'missing' ? /no longer available/ : /not valid/),
      ).toBeTruthy()
      expect(within(dialog).queryByRole('button', { name: 'Edit this event' })).toBeNull()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Open calendar' }))
      expect(router.state.location.search).toBe('')
    },
  )
  it.each(['pending', 'removing'])('preserves %s edit guards on the deep view', (kind) => {
    if (kind === 'pending') state.pending = true
    else
      state.removals['31'] = {
        key: 'calendar:31',
        domain: 'calendar',
        item: { id: '31', title: 'Same title', version: 1 },
        token: 'fixture',
        deadline: state.now + 20000,
        sending: false,
        ownerId: 101,
        generation: 1,
      }
    mount('/calendar?event=31&occurrence=2026-10-25')
    expect(
      (
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Edit this event',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(screen.queryByRole('dialog', { name: 'Explicit edit fixture' })).toBeNull()
  })
})
