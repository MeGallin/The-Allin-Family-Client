import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HorizontalScroll } from './HorizontalScroll'

function setup(width = 300, total = 900) {
  const view = render(
    <HorizontalScroll label="Examples">
      <a href="#first">First card</a>
      <button type="button">Card action</button>
    </HorizontalScroll>,
  )
  const viewport = screen.getByRole('region', { name: 'Examples' })
  Object.defineProperties(viewport, {
    clientWidth: { configurable: true, writable: true, value: width },
    scrollWidth: { configurable: true, writable: true, value: total },
    scrollLeft: { configurable: true, writable: true, value: 0 },
  })
  const update = (left: number) => {
    viewport.scrollLeft = Math.max(0, Math.min(left, viewport.scrollWidth - viewport.clientWidth))
    fireEvent.scroll(viewport)
  }
  const leftValue = (options?: ScrollToOptions | number) =>
    typeof options === 'number' ? options : (options?.left ?? 0)
  const by = vi.fn((options?: ScrollToOptions | number, _y?: number) =>
    update(viewport.scrollLeft + leftValue(options)),
  )
  const to = vi.fn((options?: ScrollToOptions | number, _y?: number) => update(leftValue(options)))
  viewport.scrollBy = by
  viewport.scrollTo = to
  fireEvent(window, new Event('resize'))
  return { ...view, viewport, by, to }
}
describe('shared horizontal scrolling', () => {
  it('labels its viewport, connects arrows and disables them at the correct ends', () => {
    const { viewport } = setup()
    const previous = screen.getByRole('button', {
      name: 'Scroll Examples left',
    }) as HTMLButtonElement
    const next = screen.getByRole('button', { name: 'Scroll Examples right' }) as HTMLButtonElement
    expect(viewport.tabIndex).toBe(0)
    expect(next.getAttribute('aria-controls')).toBe(viewport.id)
    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(false)
    for (let click = 0; click < 3; click++) fireEvent.click(next)
    expect(viewport.scrollLeft).toBe(600)
    expect(previous.disabled).toBe(false)
    expect(next.disabled).toBe(true)
    for (let click = 0; click < 3; click++) fireEvent.click(previous)
    expect(viewport.scrollLeft).toBe(0)
    expect(previous.disabled).toBe(true)
  })
  it('supports arrow/Home/End keys without capturing keyboard events from nested content', () => {
    const { viewport, by, to } = setup()
    fireEvent.keyDown(viewport, { key: 'ArrowRight' })
    expect(viewport.scrollLeft).toBe(240)
    fireEvent.keyDown(viewport, { key: 'End' })
    expect(viewport.scrollLeft).toBe(600)
    fireEvent.keyDown(viewport, { key: 'ArrowLeft' })
    expect(viewport.scrollLeft).toBe(360)
    fireEvent.keyDown(viewport, { key: 'Home' })
    expect(viewport.scrollLeft).toBe(0)
    by.mockClear()
    to.mockClear()
    const childEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    fireEvent(screen.getByRole('button', { name: 'Card action' }), childEvent)
    expect(childEvent.defaultPrevented).toBe(false)
    expect(by).not.toHaveBeenCalled()
    expect(to).not.toHaveBeenCalled()
  })
  it('hides unnecessary controls and updates when the viewport or content grows', () => {
    const { viewport } = setup(900, 900)
    expect(screen.queryByRole('group')).toBeNull()
    expect(viewport.hasAttribute('tabindex')).toBe(false)
    Object.defineProperty(viewport, 'scrollWidth', { value: 1400 })
    fireEvent(window, new Event('resize'))
    expect(screen.getByRole('group', { name: 'Examples scroll controls' })).toBeTruthy()
    Object.defineProperty(viewport, 'clientWidth', { value: 1400 })
    fireEvent(window, new Event('resize'))
    expect(screen.queryByRole('group')).toBeNull()
  })
  it('disconnects both resize observations on unmount', () => {
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe
        disconnect = disconnect
      },
    )
    const { unmount } = setup()
    expect(observe).toHaveBeenCalledTimes(2)
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})
