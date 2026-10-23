import type { ReactNode } from 'react'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Icon } from './Icon'
import './AlertBriefing.css'

export function AlertSource({
  provider,
  description,
  icon,
  href,
  linkLabel,
}: {
  provider: string
  description: string
  icon: LucideIcon
  href: string
  linkLabel: string
}) {
  return (
    <header className="alert-briefing__intro">
      <div className="alert-briefing__source">
        <span className="alert-briefing__source-icon">
          <Icon icon={icon} />
        </span>
        <div>
          <p>{provider}</p>
          <span>{description}</span>
        </div>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {linkLabel} <Icon icon={ArrowUpRight} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </header>
  )
}

export function AlertSummary({
  icon,
  label,
  metadata,
  headline,
  preview,
  tone = 'error',
}: {
  icon: LucideIcon
  label: string
  metadata?: ReactNode
  headline: string
  preview?: ReactNode
  tone?: 'error' | 'yellow' | 'amber' | 'red' | 'accent' | 'muted'
}) {
  return (
    <>
      <span className={'alert-briefing__mark alert-briefing--' + tone} aria-hidden="true">
        <Icon icon={icon} />
      </span>
      <span className="alert-briefing__meta">
        <span className={'alert-briefing__kind alert-briefing--' + tone}>{label}</span>
        {metadata}
      </span>
      <span className="alert-briefing__headline">{headline}</span>
      {preview && <span className="alert-briefing__preview">{preview}</span>}
    </>
  )
}
