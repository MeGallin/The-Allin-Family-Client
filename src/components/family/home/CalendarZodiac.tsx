import { useEffect, useId, useRef, useState } from 'react'
import { format } from 'date-fns'
import { zodiacForDate } from '../../../lib/zodiac'
import { ZodiacIcon } from './ZodiacIcon'
import { useRuntimeRule } from '../../../styles/runtime-styles'
import './CalendarZodiac.css'

/** Native top-layer disclosure stays outside the calendar scroller's clipping. */
export function CalendarZodiac({ date }: { date: Date }) {
  const dayLabel = format(date, 'EEEE d MMMM')
  const sign = zodiacForDate(date)
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const popupStyle = useRuntimeRule()
  const openedAt = useRef<{ left: number; top: number } | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = () => popup.current?.hidePopover()
    const onScroll = () => {
      const rect = trigger.current?.getBoundingClientRect()
      const previous = openedAt.current
      // A queued focus-scroll event may arrive after opening without moving the anchor.
      if (rect && previous && (rect.left !== previous.left || rect.top !== previous.top)) close()
    }
    // Dismiss on navigation through the strip rather than leaving detached details.
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="button-quiet calendar-zodiac"
        aria-label={`${sign.name}, ${sign.range}, for ${dayLabel}`}
        aria-expanded={open}
        aria-controls={id}
        popoverTarget={id}
        onBlur={() => popup.current?.hidePopover()}
        onClick={() => {
          const rect = trigger.current!.getBoundingClientRect()
          openedAt.current = { left: rect.left, top: rect.top }
          const above = rect.top >= 96
          popupStyle.update({
            left: `${Math.max(8, Math.min(rect.left, window.innerWidth - 248))}px`,
            top: above ? 'auto' : `${rect.bottom + 8}px`,
            bottom: above ? `${window.innerHeight - rect.top + 8}px` : 'auto',
          })
        }}
      >
        <ZodiacIcon sign={sign.id} />
      </button>
      <div
        ref={popup}
        id={id}
        popover="auto"
        className={'calendar-zodiac__popover ' + popupStyle.className}
        onToggle={(event) => setOpen(event.newState === 'open')}
      >
        <strong>{sign.name}</strong>
        <span>{sign.range}</span>
      </div>
    </>
  )
}
