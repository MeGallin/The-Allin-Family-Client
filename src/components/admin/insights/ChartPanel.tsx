import { useId, type ReactNode } from 'react'
import { activitySeries } from '../../../features/insights/chart-config'
import './ChartPanel.css'
export function ChartPanel({
  title,
  description,
  children,
  detail,
  wide = false,
}: {
  title: string
  description: string
  children: ReactNode
  detail?: ReactNode
  wide?: boolean
}) {
  const id = useId()
  return (
    <section
      className={'chart-panel content-surface' + (wide ? ' chart-panel--wide' : '')}
      aria-labelledby={id}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <p className="note">{description}</p>
      </header>
      {children}
      {detail}
    </section>
  )
}
export function ActivityLegend({ showSignins = false }: { showSignins?: boolean }) {
  return (
    <ul className="chart-legend" aria-label="Chart legend">
      {activitySeries.map((series) => (
        <li key={series.key}>
          <span style={{ background: series.color }} />
          {series.label}
        </li>
      ))}
      {showSignins && (
        <li>
          <span className="chart-legend__line" />
          Sign-ins
        </li>
      )}
    </ul>
  )
}
