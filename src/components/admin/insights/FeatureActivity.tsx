import type { TooltipContentProps } from 'recharts'
import { StackedActivityChart } from './StackedActivityChart'
import { Link } from 'react-router'
import type { InsightSnapshot } from '../../../features/insights/types'
import { activitySeries, featureNames } from '../../../features/insights/chart-config'
import { ActivityLegend, ChartPanel } from './ChartPanel'

function FeatureTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload.length) return null
  const row = payload[0].payload as InsightSnapshot['features'][number]
  return (
    <div className="chart-tooltip">
      <strong>
        {featureNames[row.key]} · {row.total} {row.total === 1 ? 'action' : 'actions'}
      </strong>
      {activitySeries.map((series) => (
        <p key={series.key}>
          {series.label}: {row[series.key]}
        </p>
      ))}
      <p>Audit actions, not visits or reading time.</p>
    </div>
  )
}
export function FeatureActivity({ data }: { data: InsightSnapshot }) {
  const features = data.features.map((feature) => ({ ...feature, name: featureNames[feature.key] }))
  return (
    <ChartPanel
      title="Where the family takes part"
      description="Ranked by shared actions. The mix separates adding content, maintaining it and responding."
    >
      <ActivityLegend />
      {data.summary.actions ? (
        <StackedActivityChart
          data={features}
          tooltip={FeatureTooltip}
          label="Shared activity by feature"
        />
      ) : (
        <p className="chart-empty">
          No shared actions in this period. New additions, edits, votes and reactions will appear
          here.
        </p>
      )}
      <details className="chart-data">
        <summary>Inspect feature totals</summary>
        <ul className="insight-feature-links">
          {features.map((feature) => (
            <li key={feature.key}>
              <Link to={'/admin?view=activity&type=' + feature.key + '&days=' + data.days}>
                {feature.name}
                <span>
                  {feature.total} {feature.total === 1 ? 'action' : 'actions'} · View full history
                </span>
              </Link>
              <p className="note">
                {activitySeries
                  .map((series) => `${series.label}: ${feature[series.key]}`)
                  .join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </ChartPanel>
  )
}
