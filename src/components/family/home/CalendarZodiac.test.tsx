import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CalendarZodiac } from './CalendarZodiac'

it('renders a date-specific symbol-only button linked to its own disclosure', () => {
  render(
    <>
      <CalendarZodiac date={new Date(2026, 10, 21)} />
      <CalendarZodiac date={new Date(2026, 10, 22)} />
    </>,
  )
  const scorpio = screen.getByRole('button', {
    name: 'Scorpio, 23 October–21 November, for Saturday 21 November',
  })
  const archer = screen.getByRole('button', {
    name: 'Sagittarius, 22 November–21 December, for Sunday 22 November',
  })
  expect(scorpio.textContent).toBe('')
  expect(archer.textContent).toBe('')
  expect(scorpio.getAttribute('popovertarget')).not.toBe(archer.getAttribute('popovertarget'))
  expect(document.getElementById(scorpio.getAttribute('aria-controls')!)?.textContent).toBe(
    'Scorpio23 October–21 November',
  )
  expect(scorpio.querySelector('svg')?.getAttribute('width')).toBe('20')
})

it('ignores a queued scroll notification unless the opened anchor actually moves', () => {
  render(<CalendarZodiac date={new Date(2026, 10, 21)} />)
  const button = screen.getByRole('button')
  const popup = document.getElementById(button.getAttribute('aria-controls')!)!
  const hide = vi.fn()
  popup.hidePopover = hide
  const geometry = vi.spyOn(button, 'getBoundingClientRect')
  geometry.mockReturnValue({ left: 10, top: 150, bottom: 194 } as DOMRect)
  fireEvent.click(button)
  fireEvent(popup, Object.assign(new Event('toggle'), { newState: 'open' }))
  fireEvent.scroll(window)
  expect(hide).not.toHaveBeenCalled()
  geometry.mockReturnValue({ left: 10, top: 140, bottom: 184 } as DOMRect)
  fireEvent.scroll(window)
  expect(hide).toHaveBeenCalledOnce()
})
