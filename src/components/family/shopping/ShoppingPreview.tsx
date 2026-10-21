import { Link } from 'react-router'
import { useFamilyData } from '../../../features/family/useFamilyData'
import { Panel } from '../../ui/Panel'
import { ShoppingList } from './ShoppingList'
import './ShoppingPreview.css'

export function ShoppingPreview() {
  const { shopping } = useFamilyData()
  const remaining = shopping.filter((item) => !item.checked).length
  return (
    <Panel title="Pick up on the way" action={<Link to="/lists">Open list</Link>}>
      <p className="shopping-preview__count" role="status">
        {remaining ? remaining + ' to get' : 'All picked up'}
      </p>
      <ShoppingList limit={3} />
      {shopping.length > 3 && (
        <p className="shopping-preview__more">And {shopping.length - 3} more on the list.</p>
      )}
    </Panel>
  )
}
