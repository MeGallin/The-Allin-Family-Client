import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useShopping } from '../../features/shopping/useShopping'
import { ShoppingActivity } from '../../components/family/shopping/ShoppingActivity'
import { ShoppingList } from '../../components/family/shopping/ShoppingList'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Icon } from '../../components/ui/Icon'
import './ListsPage.css'

export default function ListsPage() {
  const { items: shopping, add, pending, loading, error, refresh, feedback } = useShopping()
  const [title, setTitle] = useState('')
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const wasPending = useRef(false)
  useEffect(() => {
    if (
      wasPending.current &&
      !pending &&
      (feedback.startsWith('Item added') || feedback.startsWith('Item removed'))
    )
      inputRef.current?.focus()
    wasPending.current = pending
  }, [pending, feedback])
  const remaining = shopping.filter((item) => !item.checked).length
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = title.trim()
    if (!value) return
    if (await add(value)) {
      setTitle('')
    }
  }
  return (
    <div className="page-stack page-enter lists-page">
      <PageHeader
        title="Little things, sorted."
        description="One shared list for everyone. See who added and changed each item."
      />
      <Panel
        title="Shopping list"
        action={
          <button
            type="button"
            className="icon-button"
            aria-label="Refresh list"
            disabled={pending || loading}
            onClick={refresh}
          >
            <Icon icon={RefreshCw} />
          </button>
        }
      >
        <p className="lists-page__count">
          {loading
            ? 'Connecting to the shared list…'
            : shopping.length === 0
              ? 'Your shared list is empty'
              : remaining
                ? remaining + ' to get · ' + shopping.length + ' items'
                : 'Everything is picked up'}
        </p>
        {error && shopping.length > 0 && (
          <p className="error" role="alert">
            {error}{' '}
            <button type="button" className="button-link" onClick={refresh}>
              Try again
            </button>
          </p>
        )}
        <form className="shopping-add" onSubmit={submit}>
          <label htmlFor={inputId}>Add something</label>
          <div className="shopping-add__controls">
            <input
              id={inputId}
              ref={inputRef}
              required
              disabled={pending || loading}
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Milk"
            />
            <button type="submit" disabled={pending || loading || !title.trim()}>
              <Icon icon={Plus} />
              {pending ? 'Saving…' : 'Add item'}
            </button>
          </div>
        </form>
        <ShoppingList removable />

        <p className="lists-page__feedback" role="status">
          {feedback}
        </p>
        <ShoppingActivity />
      </Panel>
    </div>
  )
}
