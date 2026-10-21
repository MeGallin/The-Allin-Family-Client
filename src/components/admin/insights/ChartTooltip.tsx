import { Tooltip, useChartWidth, type TooltipProps } from 'recharts'

/** A plot-relative tooltip can overflow a narrow chart once its label axis is reserved. */
export function ChartTooltip({ content }: { content: TooltipProps['content'] }) {
  const width = useChartWidth() ?? 0
  return (
    <Tooltip
      content={content}
      position={width < 320 ? { x: 0, y: 0 } : undefined}
      isAnimationActive={false}
      animationDuration={0}
      cursor={{ fill: 'var(--color-accent-soft)', fillOpacity: 0.4 }}
    />
  )
}
