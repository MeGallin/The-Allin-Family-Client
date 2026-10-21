import { useEffect, useRef, type RefObject } from 'react'
import { Ellipsis, Pencil, Trash2, Info } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import './ShoppingItemMenu.css'

type Props = {
  id: string
  title: string
  disabled: boolean
  buttonRef: RefObject<HTMLElement | null>
  detailsOpen: boolean
  onEdit: () => void
  onRemove: () => void
  onDetails: () => void
}
export function ShoppingItemMenu({
  id,
  title,
  disabled,
  buttonRef,
  detailsOpen,
  onEdit,
  onRemove,
  onDetails,
}: Props) {
  const menu = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && menu.current && !menu.current.contains(event.target))
        menu.current.open = false
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', escape)
    }
  }, [buttonRef])
  function choose(action: () => void, focus = false) {
    if (menu.current) menu.current.open = false
    if (focus) buttonRef.current?.focus()
    action()
  }
  return (
    <details ref={menu} className="shopping-item-menu">
      <summary
        ref={buttonRef}
        id={'shopping-remove-' + id}
        aria-label={'Options for ' + title}
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) event.preventDefault()
        }}
      >
        <Icon icon={Ellipsis} />
      </summary>
      <div className="shopping-item-menu__popover">
        <button
          type="button"
          disabled={disabled}
          onClick={() => choose(onEdit)}
          aria-label={'Edit ' + title}
        >
          <Icon icon={Pencil} />
          Edit item
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => choose(onDetails, true)}
          aria-label={'Details for ' + title}
          aria-expanded={detailsOpen}
          aria-controls={'shopping-details-' + id}
        >
          <Icon icon={Info} />
          {detailsOpen ? 'Hide details' : 'Item details'}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => choose(onRemove)}
          aria-label={'Remove ' + title}
        >
          <Icon icon={Trash2} />
          Remove
        </button>
      </div>
    </details>
  )
}
