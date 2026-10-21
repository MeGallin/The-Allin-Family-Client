import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { InsightSnapshot } from '../../../features/insights/types'
import { activitySeries, chartDate } from '../../../features/insights/chart-config'
import { ActivityLegend, ChartPanel } from './ChartPanel'
import { ChartTooltip } from './ChartTooltip'

function PulseTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload.length) return null
  const day = payload[0].payload as InsightSnapshot['daily'][number]
  return (
    <div className="chart-tooltip">
      <strong>{chartDate(day.date, true)}</strong>
      <p>
        {day.total === null
          ? 'No shared history recorded'
          : `${day.total} shared ${day.total === 1 ? 'action' : 'actions'} · ${day.contributors} ${day.contributors === 1 ? 'contributor' : 'contributors'}`}
      </p>
      {day.total !== null &&
        activitySeries.map((series) => (
          <p key={series.key}>
            {series.label}: {day[series.key]}
          </p>
        ))}
      <p>Sign-ins: {day.signins ?? 'Not yet recorded'}</p>
    </div>
  )
}
export function ActivityPulse({ data }: { data: InsightSnapshot }) {
  const recorded = data.daily.filter((day) => day.total !== null).length
  const firstRecorded = data.daily.findIndex((day) => day.total !== null || day.signins !== null)
  const plotted = firstRecorded < 0 ? [] : data.daily.slice(firstRecorded)
  return (
    <ChartPanel
      wide
      title="The daily pulse"
      description="Shared actions show what the family does. The line shows sign-ins on the same count scale."
    >
      <ActivityLegend showSignins />
      <div className="chart-frame chart-frame--pulse">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart
            aria-label="Daily shared activity and sign-ins"
            data={plotted}
            accessibilityLayer
            margin={{ top: 12, right: 8, bottom: 4, left: -24 }}
          >
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
            <XAxis
              dataKey="date"
              tickFormatter={(day: string) => chartDate(day)}
              minTickGap={34}
              tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={PulseTooltip} />
            {activitySeries.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                stackId="actions"
                fill={series.color}
                maxBarSize={32}
                isAnimationActive={false}
              />
            ))}
            <Line
              dataKey="signins"
              name="Sign-ins"
              stroke="var(--chart-line)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 3, fill: 'var(--color-surface)', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="note">
        {recorded < 7
          ? `Early days: ${recorded} ${recorded === 1 ? 'day' : 'days'} of shared history in this view. A useful trend needs more history.`
          : `${recorded} recorded days in view.`}{' '}
        The plot starts at the first recorded day. Gaps mean history was not recorded. Today is
        still in progress. Dates use London time.
      </p>
      <details className="chart-data">
        <summary>View daily figures</summary>
        <div
          className="chart-data__scroll"
          tabIndex={0}
          role="region"
          aria-label="Daily figures table"
        >
          <table>
            <caption>
              Shared audit actions and successful sign-ins; a dash means no recorded history.
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Actions</th>
                {activitySeries.map((series) => (
                  <th scope="col" key={series.key}>
                    {series.label}
                  </th>
                ))}
                <th scope="col">Contributors</th>
                <th scope="col">Sign-ins</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{chartDate(day.date)}</th>
                  <td>{day.total ?? '—'}</td>
                  {activitySeries.map((series) => (
                    <td key={series.key}>{day[series.key] ?? '—'}</td>
                  ))}
                  <td>{day.contributors ?? '—'}</td>
                  <td>{day.signins ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </ChartPanel>
  )
}
