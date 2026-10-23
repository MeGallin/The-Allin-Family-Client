import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Icon } from './Icon'
import './Tabs.css'

export type TabItem = { id: string; label: string; icon?: LucideIcon }

/** Manual activation separates arrow-key navigation from leaving an unsaved form. */
export function Tabs({
  items,
  value,
  onChange,
  label,
  children,
}: {
  items: readonly TabItem[]
  value: string
  onChange: (value: string) => void
  label: string
  children: ReactNode
}) {
  const id = useId()
  const [focused, setFocused] = useState(value)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  useEffect(() => setFocused(value), [value])
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % items.length
        break
      case 'ArrowLeft':
        next = (index - 1 + items.length) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    const item = items[next]
    setFocused(item.id)
    buttons.current.get(item.id)?.focus()
  }
  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(button) => {
              if (button) buttons.current.set(item.id, button)
              else buttons.current.delete(item.id)
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-controls={`${id}-panel-${item.id}`}
            aria-selected={value === item.id}
            tabIndex={focused === item.id ? 0 : -1}
            onFocus={() => setFocused(item.id)}
            onKeyDown={(event) => navigate(event, index)}
            onClick={() => onChange(item.id)}
          >
            {item.icon && <Icon icon={item.icon} />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="tabs__panel"
          role="tabpanel"
          id={`${id}-panel-${item.id}`}
          aria-labelledby={`${id}-tab-${item.id}`}
          hidden={value !== item.id}
          tabIndex={0}
        >
          {value === item.id && children}
        </div>
      ))}
    </div>
  )
}
