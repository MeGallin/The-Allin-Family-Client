import type { FamilyWidget } from '../../features/widgets/types'
import { Modal } from '../ui/Modal'
import './WidgetMeals.css'

/** Read-only meal list. Ownership and edits remain with the existing settings form. */
export function WidgetMeals({ widget, onClose }: { widget: FamilyWidget; onClose: () => void }) {
  return (
    <Modal title="On the wheel" onClose={onClose} scrollable>
      <div className="widget-meals">
        <p className="note">
          {widget.meals.length} equally likely choices · Managed by {widget.owner.name}
        </p>
        <ol>
          {widget.meals.map((meal) => (
            <li key={meal.id}>{meal.title}</li>
          ))}
        </ol>
        <p className="note">The owner can change these meals in Widget settings.</p>
      </div>
    </Modal>
  )
}
