import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CurrentClock } from './CurrentClock'
import { clockStorageKey } from './clock-preferences'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 25, 0, 5, 9))
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
})
const analogue = () => screen.getByRole('button', { name: 'Analogue clock' })
const hour12 = () => screen.getByRole('button', { name: '12-hour time' })
const clock = () => screen.getByRole('timer')
function setTime(value: Date) {
  act(() => {
    vi.setSystemTime(value)
    window.dispatchEvent(new Event('focus'))
  })
}
describe('CurrentClock local time, controls and lifecycle', () => {
  it('shows seconds without live announcements and handles midnight/noon/AMPM/24h exactly', () => {
    render(<CurrentClock ownerId={101} />)
    expect(clock().textContent).toBe('00:05:09')
    expect(clock().getAttribute('aria-live')).toBe('off')
    expect(clock().getAttribute('datetime')).toBe('00:05:09')
    fireEvent.click(hour12())
    expect(clock().textContent).toBe('12:05:09AM')
    expect(clock().getAttribute('aria-label')).toBe('Your local time, 12:05:09 AM')
    setTime(new Date(2026, 9, 25, 12, 0, 0))
    expect(clock().textContent).toBe('12:00:00PM')
    setTime(new Date(2026, 9, 25, 23, 59, 59))
    expect(clock().textContent).toBe('11:59:59PM')
    act(() => vi.advanceTimersByTime(1000))
    expect(clock().textContent).toBe('12:00:00AM')
    fireEvent.click(hour12())
    expect(clock().textContent).toBe('00:00:00')
  })
  it('shows only the analogue face while retaining accessible time and all three precise hands', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(23)
    const view = render(<CurrentClock ownerId={101} />)
    expect(clock().textContent).toBe('23:05:09')
    fireEvent.click(analogue())
    expect(analogue().getAttribute('aria-pressed')).toBe('true')
    expect(clock().className).toBe('sr-only')
    expect(view.container.querySelector('.current-clock__time')).toBeNull()
    expect(clock().getAttribute('aria-label')).toBe('Your local time, 23:05:09')
    expect(
      view.container.querySelector('svg.current-clock__face')!.getAttribute('aria-hidden'),
    ).toBe('true')
    expect(view.container.querySelector('.current-clock__second')!.getAttribute('transform')).toBe(
      'rotate(54 24 24)',
    )
    expect(view.container.querySelector('.current-clock__minute')!.getAttribute('transform')).toBe(
      'rotate(30.9 24 24)',
    )
    expect(screen.queryByRole('button', { name: '12-hour time' })).toBeNull()
    expect(clock().getAttribute('aria-live')).toBe('off')
    fireEvent.click(analogue())
    expect(clock().className).toBe('current-clock__time')
    expect(view.container.querySelector('svg.current-clock__face')).toBeNull()
    fireEvent.click(hour12())
    expect(clock().textContent).toBe('11:05:09PM')
  })
  it('persists only two choices per owner and never renders the prior owner choices after a switch', () => {
    const view = render(<CurrentClock ownerId={101} />)
    fireEvent.click(hour12())
    fireEvent.click(analogue())
    expect(JSON.parse(localStorage.getItem(clockStorageKey(101))!)).toEqual({
      analogue: true,
      hour12: true,
    })
    view.rerender(<CurrentClock ownerId={202} />)
    expect(analogue().getAttribute('aria-pressed')).toBe('false')
    expect(hour12().getAttribute('aria-pressed')).toBe('false')
    expect(localStorage.getItem(clockStorageKey(202))).toBeNull()
    view.rerender(<CurrentClock ownerId={101} />)
    expect(analogue().getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('button', { name: '12-hour time' })).toBeNull()
    fireEvent.click(analogue())
    expect(hour12().getAttribute('aria-pressed')).toBe('true')
    expect(clock().textContent).toBe('12:05:09AM')
  })
  it('ignores malformed values and remains usable when storage is blocked', () => {
    localStorage.setItem(clockStorageKey(101), '{"analogue":"yes","hour12":true}')
    render(<CurrentClock ownerId={101} />)
    expect(analogue().getAttribute('aria-pressed')).toBe('false')
    expect(hour12().getAttribute('aria-pressed')).toBe('false')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked')
    })
    fireEvent.click(hour12())
    expect(clock().textContent).toBe('12:05:09AM')
    expect(screen.getByRole('status').textContent).toBe('Clock choice lasts for this visit.')
  })
  it('synchronises only this owner storage events and handles clear', () => {
    render(<CurrentClock ownerId={101} />)
    localStorage.setItem(clockStorageKey(101), JSON.stringify({ analogue: true, hour12: true }))
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: clockStorageKey(202), storageArea: localStorage }),
      ),
    )
    expect(analogue().getAttribute('aria-pressed')).toBe('false')
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: clockStorageKey(101), storageArea: localStorage }),
      ),
    )
    expect(analogue().getAttribute('aria-pressed')).toBe('true')
    localStorage.clear()
    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage })),
    )
    expect(analogue().getAttribute('aria-pressed')).toBe('false')
  })
  it('shares one second timer, stops while hidden, catches up and cleans the last subscription', () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const a = render(<CurrentClock ownerId={101} />)
    const b = render(<CurrentClock ownerId={202} />)
    expect(vi.getTimerCount()).toBe(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getAllByRole('timer').map((e) => e.textContent)).toEqual(['00:05:10', '00:05:10'])
    hidden = true
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(vi.getTimerCount()).toBe(0)
    act(() => vi.advanceTimersByTime(65000))
    expect(screen.getAllByRole('timer')[0].textContent).toBe('00:05:10')
    hidden = false
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.getAllByRole('timer').map((e) => e.textContent)).toEqual(['00:06:15', '00:06:15'])
    a.unmount()
    expect(vi.getTimerCount()).toBe(1)
    b.unmount()
    expect(vi.getTimerCount()).toBe(0)
    act(() => window.dispatchEvent(new Event('focus')))
    expect(vi.getTimerCount()).toBe(0)
  })
})
