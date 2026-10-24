import { Utensils } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Icon } from '../ui/Icon'
import './DinnerWheel.css'

export function DinnerWheel({
  meals,
  rotation = 0,
  compact = false,
}: {
  meals: { title: string }[]
  rotation?: number
  compact?: boolean
}) {
  const labels = useRef<SVGSVGElement>(null)
  useEffect(() => {
    let cancelled = false
    const fit = () => {
      if (cancelled) return
      labels.current?.querySelectorAll('text').forEach((label) => {
        label.removeAttribute('textLength')
        // SVG units: labels run from radius 100 to 280, inside the rim.
        if (
          (typeof label.getComputedTextLength === 'function'
            ? label.getComputedTextLength()
            : (label.textContent?.length ?? 0) * 10) > 180
        )
          label.setAttribute('textLength', '180')
      })
    }
    fit()
    void document.fonts?.ready.then(fit)
    return () => {
      cancelled = true
    }
  }, [meals, compact])
  const colours = Array.from({ length: 12 }, (_, index) => `var(--wheel-tone-${index + 1})`)
  const background =
    'conic-gradient(' +
    meals
      .map(
        (_, i) =>
          `${colours[i % colours.length]} ${(i * 360) / meals.length}deg ${((i + 1) * 360) / meals.length}deg`,
      )
      .join(',') +
    ')'
  return (
    <div
      className={'dinner-wheel' + (compact ? ' dinner-wheel--compact' : '')}
      role="img"
      aria-label={
        meals.length
          ? `Dinner wheel with ${meals.length} equally likely choices`
          : 'Dinner wheel with no meal choices available'
      }
    >
      <span className="dinner-wheel__pointer" />
      <div
        className="dinner-wheel__disc"
        style={{
          background: meals.length ? background : 'var(--color-surface-muted)',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {!compact && (
          <svg
            ref={labels}
            className="dinner-wheel__labels"
            viewBox="0 0 600 600"
            aria-hidden="true"
          >
            {meals.map((meal, i) => {
              const angle = ((i + 0.5) * 360) / meals.length
              const flipped = (((angle + rotation) % 360) + 360) % 360 > 180
              const x = flipped ? -100 : 100
              return (
                <g
                  key={i}
                  transform={`translate(300 300) rotate(${angle - 90 + (flipped ? 180 : 0)})`}
                >
                  <title>{meal.title}</title>
                  <text
                    className="dinner-wheel__meal"
                    x={x}
                    y={0}
                    dominantBaseline="middle"
                    textAnchor={flipped ? 'end' : 'start'}
                    lengthAdjust="spacingAndGlyphs"
                  >
                    {meal.title}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
      <span className="dinner-wheel__hub">
        <Icon icon={Utensils} />
      </span>
    </div>
  )
}
