import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FocusHourglass } from './FocusHourglass'
import { sandBounds } from './FocusHourglass.geometry'

function animationEnvironment(reduced = false) {
  let now = 0
  let hidden = false
  let intersect: IntersectionObserverCallback | undefined
  const callbacks = new Map<number, FrameRequestCallback>()
  let sequence = 0
  const media = new EventTarget() as EventTarget & { matches: boolean }
  media.matches = reduced
  vi.stubGlobal('matchMedia', () => media)
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.set(++sequence, callback)
    return sequence
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id))
  const disconnect = vi.fn()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback
      }
      observe() {}
      disconnect = disconnect
    },
  )
  return {
    callbacks,
    media,
    disconnect,
    frame(at: number) {
      now = at
      const pending = [...callbacks.values()]
      callbacks.clear()
      act(() => pending.forEach((callback) => callback(now)))
    },
    hide(value: boolean) {
      hidden = value
      act(() => document.dispatchEvent(new Event('visibilitychange')))
    },
    intersect(value: boolean) {
      act(() =>
        intersect?.(
          [{ isIntersecting: value } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      )
    },
    now(at: number) {
      now = at
    },
  }
}
const top = (container: HTMLElement) => Number(container.querySelector('rect')!.getAttribute('y'))

describe('Precision Glass presentation clock', () => {
  it('turns and settles paused sand, resumes without losing its fraction and handles an interrupted turn', () => {
    const env = animationEnvironment()
    const paused = { at: 0, elapsed: 4000 }
    const view = render(
      <FocusHourglass resting={false} anchor={paused} durationMs={10000} running={false} />,
    )
    const activeY = top(view.container)
    view.rerender(<FocusHourglass resting anchor={paused} durationMs={10000} running={false} />)
    expect(view.container.querySelector('.ft-glass-turn')!.getAttribute('data-resting')).toBe(
      'true',
    )
    expect(top(view.container)).toBe(activeY)
    env.frame(325)
    expect(view.container.querySelector('.ft-glass-turn')!.getAttribute('transform')).toBe(
      'rotate(90 120 150)',
    )
    const halfway = top(view.container)
    expect(halfway).toBeLessThan(activeY)
    expect(halfway).toBeGreaterThan(42)
    // Reverse before completion: the first new paint must retain the displayed fill.
    view.rerender(
      <FocusHourglass
        resting={false}
        anchor={{ at: 325, elapsed: 4000 }}
        durationMs={10000}
        running
      />,
    )
    expect(top(view.container)).toBe(halfway)
    expect(view.container.querySelector('.ft-glass-turn')!.getAttribute('transform')).toBe(
      'rotate(90 120 150)',
    )
    env.frame(975)
    expect(view.container.querySelector('.ft-glass-turn')!.getAttribute('transform')).toBe(
      'rotate(0 120 150)',
    )
    expect(top(view.container)).toBeCloseTo(sandBounds(0.465, 0).upperTop)
    view.rerender(
      <FocusHourglass
        resting
        anchor={{ at: 975, elapsed: 4650 }}
        durationMs={10000}
        running={false}
      />,
    )
    env.frame(1625)
    expect(view.container.querySelector('.ft-glass-turn')!.getAttribute('transform')).toBe(
      'rotate(180 120 150)',
    )
    expect(top(view.container)).toBe(42)
    const bounds = sandBounds(0.465, 1)
    expect(
      Number(view.container.querySelector('.ft-sand-upper')!.getAttribute('height')),
    ).toBeCloseTo(bounds.upperBottom - 42)
    expect(env.callbacks.size).toBe(0)
    expect(view.container.querySelector('.ft-glass-shadow')!.parentElement).toBe(
      view.container.querySelector('svg'),
    )
  })
  it('restores resting orientation directly and snaps a changed orientation with reduced motion', () => {
    const env = animationEnvironment(true)
    const view = render(
      <FocusHourglass
        resting
        anchor={{ at: 0, elapsed: 4000 }}
        durationMs={10000}
        running={false}
      />,
    )
    expect(top(view.container)).toBe(42)
    expect(env.callbacks.size).toBe(0)
    view.rerender(
      <FocusHourglass
        resting={false}
        anchor={{ at: 0, elapsed: 4000 }}
        durationMs={10000}
        running
      />,
    )
    expect(top(view.container)).toBeCloseTo(sandBounds(0.4, 0).upperTop)
    expect(env.callbacks.size).toBe(0)
    env.media.matches = false
    act(() => env.media.dispatchEvent(new Event('change')))
    expect(top(view.container)).toBeCloseTo(sandBounds(0.4, 0).upperTop)
  })
  it('derives continuous conserved sand proportions from real progress, caps at expiry and never loops', () => {
    const env = animationEnvironment()
    const view = render(
      <FocusHourglass resting={false} anchor={{ at: 0, elapsed: 0 }} durationMs={10000} running />,
    )
    expect(top(view.container)).toBe(42)
    const clip = view.container.querySelector('clipPath path')!
    expect(clip.getAttribute('d')).toBe(
      view.container.querySelector('.ft-glass-body')!.getAttribute('d'),
    )
    expect(clip.getAttribute('transform')).toContain('scale(0.97 1)')
    env.frame(2500)
    expect(top(view.container)).toBeCloseTo(sandBounds(0.25, 0).upperTop)
    expect(
      Number(view.container.querySelector('.ft-sand-grains')!.getAttribute('stroke-dashoffset')),
    ).toBeCloseTo(-8 / 6)
    expect(view.container.querySelector('svg')!.dataset.flowing).toBe('true')
    const lowerY = Number(view.container.querySelector('.ft-sand-lower')!.getAttribute('y'))
    expect(view.container.querySelector('.ft-sand-stream')!.getAttribute('d')).toBe(
      `M120 148 V${lowerY}`,
    )
    env.frame(10000)
    expect(top(view.container)).toBe(148)
    expect(view.container.querySelector('svg')!.dataset.flowing).toBe('false')
    expect(env.callbacks.size).toBe(0)
    expect(view.container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
  it('restores exact paused progress, freezes it and resumes from the new accepted anchor', () => {
    const env = animationEnvironment()
    const view = render(
      <FocusHourglass
        resting={false}
        anchor={{ at: 0, elapsed: 4321 }}
        durationMs={10000}
        running={false}
      />,
    )
    const paused = top(view.container)
    env.frame(5000)
    expect(top(view.container)).toBe(paused)
    expect(env.callbacks.size).toBe(0)
    view.rerender(
      <FocusHourglass
        resting={false}
        anchor={{ at: 5000, elapsed: 4321 }}
        durationMs={10000}
        running
      />,
    )
    env.frame(5500)
    expect(top(view.container)).toBeCloseTo(sandBounds(0.4821, 0).upperTop)
  })
  it('cancels hidden/offscreen work, catches up without counting callbacks and cleans up on unmount', () => {
    const env = animationEnvironment()
    const view = render(
      <FocusHourglass resting={false} anchor={{ at: 0, elapsed: 0 }} durationMs={10000} running />,
    )
    env.hide(true)
    expect(env.callbacks.size).toBe(0)
    env.now(5000)
    env.hide(false)
    expect(top(view.container)).toBeCloseTo(sandBounds(0.5, 0).upperTop)
    env.intersect(false)
    expect(env.callbacks.size).toBe(0)
    env.now(7000)
    env.intersect(true)
    expect(top(view.container)).toBeCloseTo(sandBounds(0.7, 0).upperTop)
    view.unmount()
    expect(env.callbacks.size).toBe(0)
    expect(env.disconnect).toHaveBeenCalledOnce()
    env.hide(false)
    expect(env.callbacks.size).toBe(0)
  })
  it('uses static second snapshots with reduced motion and reacts to preference changes', () => {
    vi.useFakeTimers()
    const env = animationEnvironment(true)
    const view = render(
      <FocusHourglass resting={false} anchor={{ at: 0, elapsed: 0 }} durationMs={10000} running />,
    )
    expect(env.callbacks.size).toBe(0)
    expect(view.container.querySelector('svg')!.dataset.flowing).toBe('false')
    env.now(5000)
    act(() => vi.advanceTimersByTime(1000))
    expect(top(view.container)).toBeCloseTo(sandBounds(0.5, 0).upperTop)
    env.media.matches = false
    act(() => env.media.dispatchEvent(new Event('change')))
    expect(env.callbacks.size).toBe(1)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('stops reduced-motion snapshot work at expiry while authoritative session still runs', () => {
    vi.useFakeTimers()
    const env = animationEnvironment(true)
    const view = render(
      <FocusHourglass
        resting={false}
        anchor={{ at: 0, elapsed: 9000 }}
        durationMs={10000}
        running
      />,
    )
    env.now(1000)
    act(() => vi.advanceTimersByTime(1000))
    expect(top(view.container)).toBe(148)
    expect(vi.getTimerCount()).toBe(0)
    expect(env.callbacks.size).toBe(0)
  })
})
