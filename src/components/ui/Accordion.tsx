import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Icon } from './Icon'
import './Accordion.css'

type AccordionItem = {
  id: string
  title: ReactNode
  content: ReactNode
}

/** One open item per group; selecting it again closes the group. */
export function Accordion({
  items,
  className = '',
  itemClassName = '',
  summaryClassName = '',
  lazy = false,
}: {
  items: AccordionItem[]
  className?: string
  itemClassName?: string
  summaryClassName?: string
  lazy?: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const selectedSummary = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    // Collapsing a long preceding item must not leave the new heading off screen.
    if (openId !== null) selectedSummary.current?.scrollIntoView?.({ block: 'nearest' })
  }, [openId])
  return (
    <ul className={'accordion ' + className}>
      {items.map((item) => (
        <li key={item.id}>
          <details className={'accordion__item ' + itemClassName} open={openId === item.id}>
            <summary
              className={'accordion__summary ' + summaryClassName}
              onClick={(event) => {
                // Keep native summary keyboard activation and React ownership of open state.
                event.preventDefault()
                selectedSummary.current = event.currentTarget
                setOpenId((current) => (current === item.id ? null : item.id))
              }}
            >
              {item.title}
              <Icon icon={ChevronDown} className="accordion__chevron" />
            </summary>
            {(!lazy || openId === item.id) && item.content}
          </details>
        </li>
      ))}
    </ul>
  )
}
