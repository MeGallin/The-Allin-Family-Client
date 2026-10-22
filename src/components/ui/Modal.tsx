import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Icon } from './Icon'
import './Modal.css'

// Nested confirmations share a scroll lock, independent of unmount order.
let openDialogs = 0
let savedOverflow = ''

export function Modal({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  busy?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fallbackFocus =
      previousFocus?.closest<HTMLElement>('main') ?? document.getElementById('family-content')
    const existingUndo = new Set(
      Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-removal]')).map(
        (button) => button.dataset.removal,
      ),
    )
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-modal-autofocus], input, textarea')?.focus()
    if (openDialogs++ === 0) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      dialog.close()
      if (--openDialogs === 0) document.body.style.overflow = savedOverflow
      // A newly scheduled removal replaces its trigger with the shared Undo control.
      const newUndo = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button[data-removal]'),
      ).find((button) => !existingUndo.has(button.dataset.removal))
      if (newUndo) newUndo.focus()
      else if (previousFocus?.isConnected) previousFocus.focus()
      else if (fallbackFocus?.isConnected) fallbackFocus.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header className="modal__header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close"
          onClick={onClose}
          disabled={busy}
        >
          <Icon icon={X} />
        </button>
      </header>
      {children}
    </dialog>
  )
}
