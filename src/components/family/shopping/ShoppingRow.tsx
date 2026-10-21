import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useShopping } from '../../../features/shopping/useShopping'
import type { ShoppingItem } from '../../../features/shopping/types'
import { Icon } from '../../ui/Icon'
import { ShoppingItemMenu } from './ShoppingItemMenu'
import { ShoppingItemDetails } from './ShoppingItemDetails'
import './ShoppingRow.css'

export function ShoppingRow({
  item,
  editable,
  disabled,
}: {
  item: ShoppingItem
  editable: boolean
  disabled: boolean
}) {
  const { check, edit, remove, removals } = useShopping()
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [title, setTitle] = useState(item.title)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const removal = removals[item.id]
  const optionsButton = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!disabled && returnFocus.current?.isConnected) {
      returnFocus.current.focus()
      returnFocus.current = null
    }
  }, [disabled, editing])
  return (
    <li className="shopping-row">
      <div className="shopping-row__main">
        <label>
          <span className="shopping-row__check">
            <input
              type="checkbox"
              aria-label={item.title}
              checked={item.checked}
              disabled={disabled || !!removal}
              onChange={(event) => {
                returnFocus.current = event.currentTarget
                void check(item)
              }}
            />
            <Icon icon={Check} />
          </span>
          <span className="shopping-row__copy">
            <span
              className={
                item.checked
                  ? 'shopping-row__title shopping-row__title--checked'
                  : 'shopping-row__title'
              }
            >
              {item.title}
            </span>
            <span className="shopping-row__meta">
              {item.version > 1
                ? item.createdBy.id === item.updatedBy.id
                  ? 'Added & updated by ' + item.createdBy.displayName
                  : item.createdBy.displayName +
                    ' added · ' +
                    item.updatedBy.displayName +
                    ' updated'
                : 'Added by ' + item.createdBy.displayName}
            </span>
          </span>
        </label>
        {editable && !removal && (
          <ShoppingItemMenu
            id={item.id}
            title={item.title}
            disabled={disabled}
            buttonRef={optionsButton}
            detailsOpen={detailsOpen}
            onEdit={() => {
              setTitle(item.title)
              setEditing(item)
            }}
            onRemove={() => {
              remove(item)
              setEditing(null)
            }}
            onDetails={() => setDetailsOpen(!detailsOpen)}
          />
        )}
      </div>
      {detailsOpen && <ShoppingItemDetails item={item} />}
      {editing && (
        <form
          className="shopping-row__edit"
          onSubmit={async (event) => {
            event.preventDefault()
            returnFocus.current = optionsButton.current
            if (await edit(editing, title.trim())) setEditing(null)
          }}
        >
          <label htmlFor={'shopping-edit-' + item.id}>Edit item name</label>
          {editing.version !== item.version && (
            <p role="alert" className="error">
              This item changed while you were editing. The latest name is “{item.title}”. Cancel
              and reopen the edit to use the latest version.
            </p>
          )}
          <input
            id={'shopping-edit-' + item.id}
            required
            disabled={disabled}
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          <div className="actions">
            <button disabled={disabled || !title.trim() || editing.version !== item.version}>
              {disabled ? 'Saving…' : 'Save name'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={disabled}
              onClick={() => {
                returnFocus.current = optionsButton.current
                setEditing(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {removal && (
        <p className="shopping-row__meta">
          {removal.sending ? 'Removing…' : 'Removal pending. Use Undo above to keep this item.'}
        </p>
      )}
    </li>
  )
}
