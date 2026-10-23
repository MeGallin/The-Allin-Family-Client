import { useId, type ReactNode } from 'react'
import './Panel.css'

type PanelProps = {
  id?: string
  tabIndex?: number
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  variant?: 'surface' | 'plain'
}

export function Panel({
  id,
  tabIndex,
  title,
  action,
  children,
  className = '',
  variant = 'surface',
}: PanelProps) {
  const titleId = useId()
  return (
    <section
      id={id}
      tabIndex={tabIndex}
      className={'panel ' + (variant === 'surface' ? 'content-surface ' : '') + className}
      aria-labelledby={titleId}
    >
      <header className="panel__header">
        <h2 id={titleId}>{title}</h2>
        {action}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}
