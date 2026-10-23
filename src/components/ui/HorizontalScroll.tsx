import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Icon } from './Icon'
import './HorizontalScroll.css'

type Props = { children: ReactNode; label: string; className?: string; toolbar?: ReactNode }

/** Native touch/trackpad scrolling with optional controls, independent of its content. */
export function HorizontalScroll({ children, label, className = '', toolbar }: Props) {
  const id = useId()
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ previous: false, next: false })
  useEffect(() => {
    const scroller = viewport.current
    if (!scroller) return
    const measure = () => {
      const previous = scroller.scrollLeft > 1
      const next = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 1
      setEdges((old) => (old.previous === previous && old.next === next ? old : { previous, next }))
    }
    measure()
    scroller.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(scroller)
    if (content.current) observer?.observe(content.current)
    return () => {
      scroller.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [children])
  const scroll = (direction: number) => {
    const scroller = viewport.current
    if (scroller) scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8 })
  }
  const overflowing = edges.previous || edges.next
  return (
    <div className={'horizontal-scroll ' + className}>
      {(toolbar || overflowing) && (
        <div className="horizontal-scroll__toolbar">
          {toolbar}
          {overflowing && (
            <div
              className="horizontal-scroll__controls"
              role="group"
              aria-label={label + ' scroll controls'}
            >
              <button
                type="button"
                className="icon-button horizontal-scroll__arrow"
                aria-label={'Scroll ' + label + ' left'}
                title={'Scroll ' + label + ' left'}
                aria-controls={id}
                disabled={!edges.previous}
                onClick={() => scroll(-1)}
              >
                <Icon icon={ChevronLeft} />
              </button>
              <button
                type="button"
                className="icon-button horizontal-scroll__arrow"
                aria-label={'Scroll ' + label + ' right'}
                title={'Scroll ' + label + ' right'}
                aria-controls={id}
                disabled={!edges.next}
                onClick={() => scroll(1)}
              >
                <Icon icon={ChevronRight} />
              </button>
            </div>
          )}
        </div>
      )}
      <div
        ref={viewport}
        id={id}
        className="horizontal-scroll__viewport"
        role="region"
        aria-label={label}
        tabIndex={overflowing ? 0 : undefined}
        onKeyDown={(event) => {
          // Nested cards keep their own keyboard behaviour (links, buttons, inputs).
          if (event.target !== event.currentTarget || !overflowing) return
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
            scroll(event.key === 'ArrowLeft' ? -1 : 1)
          else
            event.currentTarget.scrollTo({
              left: event.key === 'Home' ? 0 : event.currentTarget.scrollWidth,
            })
        }}
      >
        <div ref={content} className="horizontal-scroll__content">
          {children}
        </div>
      </div>
    </div>
  )
}
