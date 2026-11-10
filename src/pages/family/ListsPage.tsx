import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useShopping } from '../../features/shopping/useShopping'
import { ShoppingActivity } from '../../components/family/shopping/ShoppingActivity'
import { ShoppingList } from '../../components/family/shopping/ShoppingList'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { WidgetHelp } from '../../components/ui/WidgetHelp'
import { RefreshButton } from '../../components/ui/RefreshButton'
import { Icon } from '../../components/ui/Icon'
import './ListsPage.css'
import { ImportanceOption } from '../../components/family/shopping/ImportanceOption'
import { ShoppingControls } from '../../components/family/shopping/ShoppingControls'
import { shoppingSort, shoppingFilter, shoppingView } from '../../features/shopping/shopping-view'
import { useCollectionFilters } from '../../hooks/useCollectionFilters'

export default function ListsPage({ embedded = false }: { embedded?: boolean }) {
  const { items: shopping, add, pending, loading, error, refresh, feedback } = useShopping()
  const { query, sort, filter, setQuery, setSort, setFilter, reset } = useCollectionFilters({
    sort: shoppingSort,
    filter: shoppingFilter,
  })
  const visible = shoppingView(shopping, query, sort, filter)
  const [title, setTitle] = useState('')
  const [important, setImportant] = useState(false)
  const guard = useDraftGuard(!!title || important, pending && (!!title || important))
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
    if (await add(value, important)) {
      guard.complete(() => {
        setTitle('')
        setImportant(false)
      })
    }
  }
  return (
    <div className="page-stack page-enter lists-page">
      {!embedded && (
        <PageHeader title="Little things, sorted." description="One list. Everyone’s essentials." />
      )}
      <div className="content-layout">
        <div className="content-layout__main">
          <ShoppingControls
            query={query}
            sort={sort}
            filter={filter}
            onQuery={setQuery}
            onSort={setSort}
            onFilter={setFilter}
            onReset={reset}
            count={visible.length}
            total={shopping.length}
          />
          <Panel
            title="Shopping list"
            action={
              <RefreshButton label="Refresh list" disabled={pending || loading} onClick={refresh} />
            }
          >
            <WidgetHelp>
              <p>Keep one shopping list together. Changes are shared with the signed-in family.</p>
              <ol>
                <li>
                  <strong>Add what you need.</strong> Type a name in Add something, optionally mark
                  it Important, then choose Add item. Wait for the saved feedback before adding
                  another item. The item’s attribution shows who added or updated it.
                </li>
                <li>
                  <strong>Tick items as you shop.</strong> Select an item’s checkbox when it is
                  picked up. Select it again to put it back on the to-get list. Each change saves
                  immediately; ticking does not delete the item.
                </li>
                <li>
                  <strong>Find the right view.</strong> Search by item name or the person who
                  added/edited it. Use Show to see Still to get, Picked up, Important or other
                  groups, and choose a sort order. Reset view restores the default filters. These
                  controls change what you see, not the shared items.
                </li>
                <li>
                  <strong>Edit or inspect an item.</strong> Open its three-dot options. Edit item
                  changes the name or importance; choose Save changes to keep the edit. Item details
                  and List history explain recorded changes. Family members can update shared items,
                  including ones added by someone else.
                </li>
                <li>
                  <strong>Remove only what you no longer need.</strong> Choose Remove from the
                  item’s options. Use Undo within the 20-second countdown to cancel removal; after
                  it finishes, the item leaves the active list. Checking an item is the better
                  choice when you only want to mark it picked up.
                </li>
              </ol>
              <p>
                There is no separate Save button for adding, checking or removing. Watch the
                saving/error feedback. If an edit changed elsewhere, review the conflict before
                saving. Refresh list loads saved changes; it does not save unfinished typing.
              </p>
            </WidgetHelp>
            <p className="lists-page__count">
              {loading
                ? 'Connecting to the shared list…'
                : shopping.length === 0
                  ? 'Your shared list is empty'
                  : remaining
                    ? remaining +
                      ' to get · ' +
                      shopping.length +
                      (shopping.length === 1 ? ' item' : ' items')
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
              <ImportanceOption
                checked={important}
                disabled={pending || loading}
                onChange={setImportant}
              />
            </form>
            <ShoppingList
              viewKey={query + ':' + sort + ':' + filter}
              removable
              view={visible}
              onReset={reset}
            />

            <p className="lists-page__feedback" role="status">
              {feedback}
            </p>
          </Panel>
        </div>
        <aside className="content-layout__aside" aria-label="Shopping history">
          <Panel title="List history">
            <ShoppingActivity />
          </Panel>
        </aside>
      </div>
    </div>
  )
}
