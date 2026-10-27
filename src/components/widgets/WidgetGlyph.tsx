import {
  BookHeart,
  CircleHelp,
  Compass,
  Footprints,
  Hourglass,
  ShoppingBasket,
  Vote,
} from 'lucide-react'
import type { WidgetStoreId } from '../../features/widgets/widget-catalogue'
import { Icon } from '../ui/Icon'
import './WidgetGlyph.css'

const icons = {
  shopping: ShoppingBasket,
  polls: Vote,
  focus: Hourglass,
  adventure: Compass,
  recommendations: BookHeart,
  walking: Footprints,
  quiz: CircleHelp,
}

/** Shared widget identity without the Store's coloured tile wrapper. */
export function WidgetGlyph({
  id,
}: {
  id: Exclude<WidgetStoreId, 'sudoku' | 'word' | 'countdown'>
}) {
  if (id === 'jobs') {
    return (
      <svg
        className="widget-glyph icon-jobs"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 28 32 11l20 17v24a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3Z" fill="#f6faf2" />
        <path
          d="m8 29 24-20 24 20"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m21 34 3 3 5-6m-8 14 3 3 5-6m6-7h9m-9 11h9"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (id === 'dinner') {
    return <span className="widget-glyph icon-dinner-wheel" aria-hidden="true" />
  }
  return <Icon icon={icons[id]} />
}
