import { useId, useLayoutEffect, useRef } from 'react'
import './FocusHourglass.css'
import {
  GLASS_PATH,
  INNER_SCALE,
  SAND_BASE,
  SAND_NECK,
  SAND_TOP,
  sandBounds,
} from './FocusHourglass.geometry'

type Props = {
  anchor: { at: number; elapsed: number }
  durationMs: number
  running: boolean
  resting: boolean
}

// Presentation only: the workspace supplies its authoritative monotonic timer anchor.
// Sand moves without React renders or writes; the numeric timer remains the accessible clock.
export function FocusHourglass({ anchor, durationMs, running, resting }: Props) {
  const id = useId().replace(/:/g, '')
  const svg = useRef<SVGSVGElement>(null)
  const upper = useRef<SVGRectElement>(null)
  const lower = useRef<SVGRectElement>(null)
  const stream = useRef<SVGPathElement>(null)
  const grains = useRef<SVGPathElement>(null)
  const body = useRef<SVGGElement>(null)
  const turn = useRef({ value: resting ? 1 : 0, from: resting ? 1 : 0, to: resting ? 1 : 0, at: 0 })
  useLayoutEffect(() => {
    const element = svg.current
    if (!element) return
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let frame: number | undefined
    let interval: ReturnType<typeof setInterval> | undefined
    let onscreen = true
    const target = resting ? 1 : 0
    if (turn.current.to !== target)
      turn.current = {
        value: turn.current.value,
        from: turn.current.value,
        to: target,
        at: performance.now(),
      }
    const cancel = () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      if (interval !== undefined) clearInterval(interval)
      frame = undefined
      interval = undefined
    }
    const paint = () => {
      const elapsed = anchor.elapsed + (running ? Math.max(0, performance.now() - anchor.at) : 0)
      const progress = durationMs > 0 ? Math.max(0, Math.min(1, elapsed / durationMs)) : 0
      if (motion?.matches) turn.current = { value: target, from: target, to: target, at: 0 }
      const phase = motion?.matches
        ? 1
        : Math.min(1, Math.max(0, (performance.now() - turn.current.at) / 650))
      const eased = phase * phase * (3 - 2 * phase)
      turn.current.value = turn.current.from + (turn.current.to - turn.current.from) * eased
      body.current?.setAttribute('transform', `rotate(${turn.current.value * 180} 120 150)`)
      const settling = Math.abs(turn.current.value - target) > 0.000001
      const bounds = sandBounds(progress, turn.current.value)
      upper.current?.setAttribute('y', String(bounds.upperTop))
      upper.current?.setAttribute(
        'height',
        String(Math.max(0, bounds.upperBottom - bounds.upperTop)),
      )
      lower.current?.setAttribute('y', String(bounds.lowerTop))
      lower.current?.setAttribute(
        'height',
        String(Math.max(0, bounds.lowerBottom - bounds.lowerTop)),
      )
      stream.current?.setAttribute('d', `M120 148 V${bounds.lowerTop}`)
      grains.current?.setAttribute('d', `M120 148 V${bounds.lowerTop}`)
      grains.current?.setAttribute(
        'stroke-dashoffset',
        String(-((performance.now() % 600) / 600) * 8),
      )
      element.dataset.flowing = String(
        running && progress < 1 && !settling && !resting && !motion?.matches,
      )
      return (running && progress < 1) || settling
    }
    const animate = () => {
      frame = undefined
      if (paint()) frame = requestAnimationFrame(animate)
    }
    const sync = () => {
      cancel()
      element.dataset.flowing = 'false'
      if (document.hidden || !onscreen) return
      if (!paint()) return
      if (motion?.matches)
        interval = setInterval(() => {
          if (!paint()) cancel()
        }, 1000)
      else frame = requestAnimationFrame(animate)
    }
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver(([entry]) => {
            onscreen = entry.isIntersecting
            sync()
          })
    observer?.observe(element)
    document.addEventListener('visibilitychange', sync)
    motion?.addEventListener('change', sync)
    sync()
    return () => {
      cancel()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      motion?.removeEventListener('change', sync)
    }
  }, [anchor, durationMs, running, resting])

  return (
    <svg
      ref={svg}
      className="ft-hourglass"
      viewBox="0 0 240 300"
      aria-hidden="true"
      focusable="false"
      data-flowing="false"
    >
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2=".3">
          <stop stopColor="var(--color-accent)" stopOpacity=".09" />
          <stop offset=".45" stopColor="var(--color-surface)" stopOpacity=".12" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity=".13" />
        </linearGradient>
        <linearGradient id={`${id}-sand`} x1="0" x2="1" y1="0" y2=".5">
          <stop stopColor="var(--color-accent)" stopOpacity=".55" />
          <stop offset=".55" stopColor="var(--color-accent)" stopOpacity=".92" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity=".65" />
        </linearGradient>
        <clipPath id={`${id}-inside`}>
          <path
            d={GLASS_PATH}
            transform={`translate(120 0) scale(${INNER_SCALE} 1) translate(-120 0)`}
          />
        </clipPath>
      </defs>
      <ellipse cx="120" cy="283" rx="76" ry="5" className="ft-glass-shadow" />
      <g ref={body} className="ft-glass-turn" data-resting={resting}>
        <path d={GLASS_PATH} fill={`url(#${id}-glass)`} className="ft-glass-body" />
        <g clipPath={`url(#${id}-inside)`} fill={`url(#${id}-sand)`}>
          <rect
            ref={upper}
            className="ft-sand-upper"
            x="0"
            y={SAND_TOP}
            width="240"
            height={SAND_NECK - SAND_TOP}
          />
          <rect ref={lower} className="ft-sand-lower" x="0" y={SAND_BASE} width="240" height="0" />
          <path ref={stream} d="M120 148V260" className="ft-sand-stream" />
          <path ref={grains} d="M120 148V260" className="ft-sand-stream ft-sand-grains" />
          <path
            d="M65 49 C66 92 85 118 106 135 M66 248 C68 215 83 194 102 175"
            className="ft-glass-reflection"
          />
          <path
            d="M174 54 C173 88 161 108 143 125 M175 252 C174 228 164 207 150 192"
            className="ft-glass-reflection ft-glass-reflection-faint"
          />
        </g>
        <path d="M49 29 H191 M49 271 H191" className="ft-glass-rim" />
        <path d="M53 33 H187 M53 267 H187" className="ft-glass-rim-light" />
      </g>
    </svg>
  )
}
