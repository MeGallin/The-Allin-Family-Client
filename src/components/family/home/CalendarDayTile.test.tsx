import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, it } from 'vitest'
import { CalendarDayTile } from './CalendarDayTile'

it('marks only available saved plans for the subtle background, preserving weekend and today states', () => {
  const props = {
    date: new Date(2026, 9, 24),
    calendarHref: '/calendar',
    isToday: true,
    plans: [
      {
        id: 'one',
        title: 'Saved family plan',
        startsAt: '2026-10-24T00:00:00Z',
        allDay: true,
        detail: '',
      },
    ],
    plansUnavailable: false,
    forecast: null,
    indicators: [],
  }
  const view = render(
    <MemoryRouter>
      <CalendarDayTile {...props} />
    </MemoryRouter>,
  )
  const tile = () => view.container.querySelector('.calendar-day-tile')!
  expect(tile().classList.contains('has-plans')).toBe(true)
  expect(tile().classList.contains('is-weekend')).toBe(true)
  expect(tile().classList.contains('is-today')).toBe(true)
  view.rerender(
    <MemoryRouter>
      <CalendarDayTile {...props} plans={[]} />
    </MemoryRouter>,
  )
  expect(tile().classList.contains('has-plans')).toBe(false)
  view.rerender(
    <MemoryRouter>
      <CalendarDayTile {...props} plansUnavailable />
    </MemoryRouter>,
  )
  expect(tile().classList.contains('has-plans')).toBe(false)
})

it('opens every saved plan in the shared modal without replacing the separate add-date link', () => {
  const plans = Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    title: i < 2 ? 'Same plan' : 'Plan ' + (i + 1),
    startsAt: new Date(2026, 9, 25, 8 + i).toISOString(),
    allDay: i === 0,
    detail: 'Saved note ' + (i + 1),
  }))
  const view = render(
    <MemoryRouter>
      <CalendarDayTile
        date={new Date(2026, 9, 25)}
        calendarHref="/calendar?compose=event&date=2026-10-25"
        isToday
        plans={plans}
        plansUnavailable={false}
        forecast={null}
        indicators={[]}
      />
    </MemoryRouter>,
  )
  const add = screen.getByRole('link', { name: /\. Add a plan\.$/ })
  expect(add.getAttribute('href')).toBe('/calendar?compose=event&date=2026-10-25')
  expect(add.getAttribute('aria-label')).not.toContain('Same plan')
  const trigger = screen.getByRole('button', { name: 'View 5 plans for Sunday 25 October' })
  expect(trigger.textContent).toContain('5 plans · View all')
  expect(trigger.closest('a')).toBeNull()
  trigger.focus()
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Plans for Sunday 25 October' })
  expect(within(dialog).getAllByRole('listitem')).toHaveLength(5)
  expect(within(dialog).getAllByRole('heading', { name: 'Same plan' })).toHaveLength(2)
  expect(within(dialog).getByText('All day')).toBeTruthy()
  expect(within(dialog).getByText('Saved note 5')).toBeTruthy()
  expect(within(dialog).getAllByRole('link', { name: /Open .* in calendar/ })).toHaveLength(5)
  expect(
    within(dialog).getByRole('link', { name: 'Open Plan 5 in calendar' }).getAttribute('href'),
  ).toBe('/calendar?q=Plan+5')
  expect(within(dialog).getByRole('link', { name: 'Add another plan' }).getAttribute('href')).toBe(
    add.getAttribute('href'),
  )
  expect(view.container.querySelector('.calendar-day-tile .modal')).toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})

it('closes an unavailable day dialog without reopening it automatically after recovery', () => {
  const props = {
    date: new Date(2026, 9, 25),
    calendarHref: '/calendar?compose=event&date=2026-10-25',
    isToday: true,
    plans: [
      { id: '1', title: 'Saved plan', startsAt: '2026-10-25T12:00:00Z', allDay: false, detail: '' },
    ],
    forecast: null,
    indicators: [],
  }
  const view = render(
    <MemoryRouter>
      <CalendarDayTile {...props} plansUnavailable={false} />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'View 1 plan for Sunday 25 October' }))
  expect(screen.getByRole('dialog')).toBeTruthy()
  view.rerender(
    <MemoryRouter>
      <CalendarDayTile {...props} plansUnavailable />
    </MemoryRouter>,
  )
  expect(screen.queryByRole('dialog')).toBeNull()
  view.rerender(
    <MemoryRouter>
      <CalendarDayTile {...props} plansUnavailable={false} />
    </MemoryRouter>,
  )
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('button', { name: 'View 1 plan for Sunday 25 October' })).toBeTruthy()
})
