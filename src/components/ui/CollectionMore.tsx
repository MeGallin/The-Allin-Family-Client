import { useRef } from 'react'
import './CollectionMore.css'

type Props = {
  shown: number
  total: number
  remaining: number
  showMore: () => void
  label: string
}
export function CollectionMore({ shown, total, remaining, showMore, label }: Props) {
  const control = useRef<HTMLButtonElement>(null)
  if (!remaining) return null
  return (
    <div className="collection-more">
      <p className="note" role="status">
        Showing {shown} of {total} {label}
      </p>
      <button
        ref={control}
        type="button"
        className="secondary"
        onClick={() => {
          const list = control.current?.closest('.collection-more')?.previousElementSibling
          const previous = new Set(list ? Array.from(list.children) : [])
          showMore()
          requestAnimationFrame(() => {
            const added = list && Array.from(list.children).find((item) => !previous.has(item))
            if (added instanceof HTMLElement) {
              added.tabIndex = -1
              added.focus({ preventScroll: true })
            }
          })
        }}
      >
        Show more {label}
      </button>
    </div>
  )
}
