import { useId, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useFamilyData } from '../../features/family/useFamilyData'
import { ShoppingList } from '../../components/family/shopping/ShoppingList'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Icon } from '../../components/ui/Icon'
import './ListsPage.css'

export default function ListsPage() {
  const { shopping, addShoppingItem } = useFamilyData()
  const [title, setTitle] = useState('')
  const [feedback, setFeedback] = useState('')
  const inputId = useId()
  const remaining = shopping.filter((item) => !item.checked).length
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = title.trim()
    if (!value) return
    addShoppingItem(value)
    setFeedback(value + ' added to this preview.')
    setTitle('')
  }
  return (
    <div className="page-stack page-enter lists-page">
      <PageHeader
        title="Little things, sorted."
        description="Keep the next shop in one handy place."
      />
      <Panel title="Shopping list">
        <p className="lists-page__count">
          {remaining ? remaining + ' still to get' : 'Everything is picked up'}
        </p>
        <ShoppingList removable />
        <form className="shopping-add" onSubmit={submit}>
          <label htmlFor={inputId}>Add something</label>
          <div className="shopping-add__controls">
            <input
              id={inputId}
              required
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do we need?"
            />
            <button type="submit">
              <Icon icon={Plus} />
              Add item
            </button>
          </div>
        </form>
        <p className="lists-page__feedback" role="status">
          {feedback}
        </p>
      </Panel>
    </div>
  )
}
