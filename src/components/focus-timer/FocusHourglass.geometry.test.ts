import { describe, expect, it } from 'vitest'
import { sandBounds } from './FocusHourglass.geometry'

// Independent numerical integration of the original glass Beziers, not the
// production lookup table. This catches a drifting contour, or linear-height fill.
function referenceWidth(y: number) {
  const xs = y < 145 ? [54, 54, 73, 111] : [111, 73, 54, 54]
  const ys = y < 145 ? [34, 91, 114, 145] : [157, 188, 211, 266]
  if (y >= 145 && y <= 157) {
    const t = (y - 145) / 12
    return 2 * (120 - ((1 - t) ** 2 * 111 + 2 * (1 - t) * t * 120 + t * t * 111)) * 0.97
  }
  const bezier = (points: number[], t: number) =>
    (1 - t) ** 3 * points[0] +
    3 * (1 - t) ** 2 * t * points[1] +
    3 * (1 - t) * t * t * points[2] +
    t ** 3 * points[3]
  let lo = 0,
    hi = 1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (bezier(ys, mid) < y) lo = mid
    else hi = mid
  }
  return 2 * (120 - bezier(xs, (lo + hi) / 2)) * 0.97
}
function area(top: number, base: number) {
  const step = (base - top) / 512
  let result = 0
  for (let i = 0; i < 512; i++) result += referenceWidth(top + (i + 0.5) * step) * step
  return result
}
describe('curved chamber sand volume', () => {
  it('transfers equal area against the actual curved walls at partial and full progress', () => {
    const full = area(42, 148)
    for (const progress of [0, 0.001, 0.1, 0.25, 0.5, 0.75, 0.9, 0.999, 1]) {
      for (const rest of [0, 0.25, 0.5, 0.75, 1]) {
        const levels = sandBounds(progress, rest)
        const remaining = area(levels.upperTop, levels.upperBottom)
        const fallen = area(levels.lowerTop, levels.lowerBottom)
        expect(remaining / full).toBeCloseTo(1 - progress, 4)
        expect(fallen / full).toBeCloseTo(progress, 4)
        expect((remaining + fallen) / full).toBeCloseTo(1, 4)
      }
    }
  })
  it('has stable empty/full endpoints and monotonic surfaces without overflow or a loop', () => {
    expect(sandBounds(-1, 0)).toEqual({
      upperTop: 42,
      upperBottom: 148,
      lowerTop: 263,
      lowerBottom: 263,
    })
    expect(sandBounds(1, 0).upperTop).toBe(148)
    expect(sandBounds(2, 0)).toEqual(sandBounds(1, 0))
    let previous = sandBounds(0, 0)
    for (let i = 1; i <= 100; i++) {
      const next = sandBounds(i / 100, 0)
      expect(next.upperTop).toBeGreaterThan(previous.upperTop)
      expect(next.lowerTop).toBeLessThan(previous.lowerTop)
      expect(next.lowerTop).toBeGreaterThan(154)
      previous = next
    }
  })
  it('settles the same paused volume against each visual floor after the half turn', () => {
    for (const progress of [0.1, 0.5, 0.9]) {
      const rest = sandBounds(progress, 1)
      expect(rest.upperTop).toBe(42)
      expect(rest.lowerTop).toBe(154)
      expect(rest.upperBottom).toBeLessThan(148)
      expect(rest.lowerBottom).toBeLessThan(263)
    }
  })
})
