import { Suspense, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Accordion } from './Accordion'
import { AlertSummary } from './AlertBriefing'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { LoadingState } from './LoadingState'
import './IndicatorStrip.css'

export type CalendarIndicator = {
  id: string
  label: string
  compactLabel?: string
  accessibleLabel: string
  description: string
  source: string
  icon: LucideIcon
  tone: 'error' | 'yellow' | 'amber' | 'red' | 'accent' | 'muted'
  priority: number
  dialogTitle: string
  details: () => ReactNode
}

/** A service group occupies one slot; its own notice count belongs in its label. */
export function IndicatorStrip({
  indicators,
  dayLabel,
}: {
  indicators: readonly CalendarIndicator[]
  dayLabel: string
}) {
  const [view, setView] = useState<{ id: string } | 'all' | null>(null)
  const ordered = [...indicators].sort(
    (a, b) => a.priority - b.priority || a.id.localeCompare(b.id),
  )
  const visible = ordered.slice(0, 3)
  const remaining = ordered.length - visible.length
  const selected =
    typeof view === 'object' && view ? ordered.find((item) => item.id === view.id) : undefined
  return (
    <div className="indicator-strip" aria-label={'Indicators for ' + dayLabel}>
      {visible.map((item) => (
        <button
          key={item.id}
          type="button"
          className={
            'indicator-strip__item indicator-strip--' +
            item.tone +
            (item.compactLabel ? ' has-compact-label' : '')
          }
          title={'View ' + item.source + ' · ' + item.description}
          aria-label={item.accessibleLabel}
          aria-haspopup="dialog"
          onClick={() => setView({ id: item.id })}
        >
          <Icon icon={item.icon} />
          <span className="indicator-strip__label">{item.label}</span>
          {item.compactLabel && (
            <span className="indicator-strip__compact-label" aria-hidden="true">
              {item.compactLabel}
            </span>
          )}
        </button>
      ))}
      {remaining > 0 && (
        <button
          type="button"
          className="indicator-strip__more"
          title={`View all ${ordered.length} indicators for ${dayLabel}`}
          aria-label={`View all ${ordered.length} indicators for ${dayLabel}; ${remaining} more`}
          aria-haspopup="dialog"
          onClick={() => setView('all')}
        >
          +{remaining} more
        </button>
      )}
      {!ordered.length && <span className="indicator-strip__quiet">No extra indicators</span>}
      {view !== null && (
        <Modal
          title={selected?.dialogTitle ?? 'Indicators · ' + dayLabel}
          onClose={() => setView(null)}
          className="indicator-dialog"
          scrollable
        >
          {selected ? (
            <Suspense fallback={<LoadingState label="Opening details…" />}>
              {selected.details()}
            </Suspense>
          ) : ordered.length ? (
            <Accordion
              lazy
              itemClassName="alert-briefing__item"
              summaryClassName="alert-briefing__summary"
              items={ordered.map((item) => ({
                id: item.id,
                title: (
                  <AlertSummary
                    icon={item.icon}
                    label={item.source}
                    tone={item.tone}
                    headline={item.description}
                    preview={item.label}
                  />
                ),
                content: (
                  <div className="indicator-dialog__detail">
                    <Suspense fallback={<LoadingState label="Opening details…" />}>
                      {item.details()}
                    </Suspense>
                  </div>
                ),
              }))}
            />
          ) : (
            <p>
              These indicators are no longer available. Close this dialog to check the calendar.
            </p>
          )}
        </Modal>
      )}
    </div>
  )
}
