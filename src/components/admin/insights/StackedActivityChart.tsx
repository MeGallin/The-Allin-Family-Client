import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import type { InsightCounts } from '../../../features/insights/types'
import { activitySeries } from '../../../features/insights/chart-config'
import { ChartTooltip } from './ChartTooltip'
import { useRuntimeStyles } from '../../../styles/runtime-styles'

export function StackedActivityChart({
  data,
  tooltip,
  label,
  height = 272,
  fullLabels = false,
}: {
  data: (InsightCounts & { name: string })[]
  tooltip: TooltipProps['content']
  label: string
  height?: number
  fullLabels?: boolean
}) {
  const frameClass = useRuntimeStyles({ height: `${height}px` })
  return (
    <div className={'chart-frame ' + frameClass}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          aria-label={label}
          data={data}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={fullLabels ? 92 : 78}
            tickFormatter={
              fullLabels
                ? undefined
                : (name: string) => (name.length > 11 ? name.slice(0, 10) + '…' : name)
            }
            tick={{ fill: 'var(--chart-axis)', fontSize: fullLabels ? 12 : 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip content={tooltip} />
          {activitySeries.map((series) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              name={series.label}
              stackId="actions"
              fill={series.color}
              maxBarSize={22}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
