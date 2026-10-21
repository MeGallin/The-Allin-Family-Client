import { useId, useRef, type ReactNode } from 'react'
import './ViewControls.css'
export function ViewControls({
  label,
  queryLabel,
  sortLabel = 'Sort by',
  placeholder,
  hint,
  query,
  sort,
  options,
  onQuery,
  onSort,
  onReset,
  active,
  count,
  total,
  noun,
  extra,
}: {
  label: string
  sortLabel?: string
  queryLabel: string
  placeholder: string
  hint: string
  query: string
  sort: string
  options: readonly (readonly [string, string])[]
  onQuery: (value: string) => void
  onSort: (value: string) => void
  onReset: () => void
  active: boolean
  count: number
  total: number
  noun: string
  extra?: ReactNode
}) {
  const id = useId()
  const search = useRef<HTMLInputElement>(null)
  return (
    <section className="view-controls" aria-label={label}>
      <div className={'view-controls__fields' + (extra ? ' view-controls__fields--extra' : '')}>
        <div>
          <label htmlFor={id + '-search'}>{queryLabel}</label>
          <input
            ref={search}
            id={id + '-search'}
            type="search"
            value={query}
            maxLength={100}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            aria-describedby={id + '-hint'}
          />
        </div>
        <div>
          <label htmlFor={id + '-sort'}>{sortLabel}</label>
          <select id={id + '-sort'} value={sort} onChange={(e) => onSort(e.target.value)}>
            {options.map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </div>
        {extra}
      </div>
      <div className="view-controls__summary">
        <p id={id + '-hint'}>{hint}</p>
        <p role="status">
          {count} of {total} {noun}
          {total === 1 ? '' : 's'}
        </p>
        {active && (
          <button
            type="button"
            className="button-link"
            onClick={() => {
              onReset()
              search.current?.focus()
            }}
          >
            Reset view
          </button>
        )}
      </div>
    </section>
  )
}
