import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, it } from 'vitest'
import { CalendarDayTile } from './CalendarDayTile'

it('marks only available saved plans for the subtle background, preserving weekend and today states', () => {
  const props = {
    date: new Date(2026, 9, 24),
    calendarHref: '/calendar',
    isToday: true,
    plans: [{ title: 'Saved family plan' }],
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
