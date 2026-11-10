import type { ReactNode } from 'react'
import './WidgetHelp.css'

export function WidgetHelp({
  title = 'How to use',
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <details className="widget-help">
      <summary>{title}</summary>
      <div className="widget-help__content">{children}</div>
    </details>
  )
}
