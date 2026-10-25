export const GLASS_PATH =
  'M54 34 C54 91 73 114 111 145 Q120 151 111 157 C73 188 54 211 54 266 L186 266 C186 211 167 188 129 157 Q120 151 129 145 C167 114 186 91 186 34 Z'
export const SAND_TOP = 42
export const SAND_NECK = 148
export const SAND_BASE = 263
export const INNER_SCALE = 0.97

function cubic(points: number[], t: number) {
  const u = 1 - t
  return (
    u ** 3 * points[0] + 3 * u * u * t * points[1] + 3 * u * t * t * points[2] + t ** 3 * points[3]
  )
}

// Sample the exact left wall once, outside the animation loop. The right is its mirror.
const wall: { x: number; y: number }[] = []
for (let i = 0; i <= 128; i++) {
  const t = i / 128
  wall.push({ x: cubic([54, 54, 73, 111], t), y: cubic([34, 91, 114, 145], t) })
}
for (let i = 1; i <= 128; i++) {
  const t = i / 128,
    u = 1 - t
  wall.push({ x: u * u * 111 + 2 * u * t * 120 + t * t * 111, y: 145 + 12 * t })
}
for (let i = 1; i <= 128; i++) {
  const t = i / 128
  wall.push({ x: cubic([111, 73, 54, 54], t), y: cubic([157, 188, 211, 266], t) })
}
function width(y: number) {
  const index = wall.findIndex((point) => point.y >= y)
  const a = wall[index - 1],
    b = wall[index]
  const x = a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y)
  return 2 * (120 - x) * INNER_SCALE
}
function chamber(top: number, base: number) {
  const rows = [{ y: top, area: 0 }]
  for (let y = top + 0.25; y <= base; y += 0.25) {
    const previous = rows[rows.length - 1]
    rows.push({ y, area: previous.area + (width(previous.y) + width(y)) * 0.125 })
  }
  return rows
}
const upper = chamber(SAND_TOP, SAND_NECK)
const lower = chamber(154, SAND_BASE)
const volume = upper[upper.length - 1].area
function surface(rows: ReturnType<typeof chamber>, amount: number) {
  const target = rows[rows.length - 1].area - amount
  let lo = 0,
    hi = rows.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (rows[mid].area < target) lo = mid
    else hi = mid
  }
  const a = rows[lo],
    b = rows[hi]
  return a.y + ((b.y - a.y) * (target - a.area)) / (b.area - a.area)
}
// During a turn, move each fixed sand volume through its chamber in cumulative
// area coordinates. Even intermediate frames conserve volume, unlike tweening heights.
export function sandBounds(progress: number, resting: number) {
  const fraction = Math.max(0, Math.min(1, progress))
  const rest = Math.max(0, Math.min(1, resting))
  const remaining = volume * (1 - fraction)
  const fallen = volume * fraction
  const lowerCapacity = lower[lower.length - 1].area
  const upperStart = (volume - remaining) * (1 - rest)
  const lowerStart = (lowerCapacity - fallen) * (1 - rest)
  return {
    upperTop: surface(upper, volume - upperStart),
    upperBottom: surface(upper, volume - upperStart - remaining),
    lowerTop: surface(lower, lowerCapacity - lowerStart),
    lowerBottom: surface(lower, lowerCapacity - lowerStart - fallen),
  }
}
