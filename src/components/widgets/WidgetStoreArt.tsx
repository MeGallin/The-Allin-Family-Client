import {
  CalendarDays,
  Grid2X2,
  NotebookPen,
  ShoppingBasket,
  Hourglass,
  Utensils,
  Vote,
} from 'lucide-react'
import type { WidgetStoreId } from '../../features/widgets/widget-catalogue'
import { Icon } from '../ui/Icon'
import './WidgetStoreArt.css'
const icons = {
  shopping: ShoppingBasket,
  polls: Vote,
  dinner: Utensils,
  sudoku: Grid2X2,
  focus: Hourglass,
  word: NotebookPen,
  countdown: CalendarDays,
}

/** Decorative store artwork, never a second implementation of the working tools. */
export function WidgetAppIcon({ id }: { id: WidgetStoreId }) {
  return (
    <span className={'app-icon app-icon--' + id} aria-hidden="true">
      {id === 'jobs' ? (
        <svg className="icon-jobs" viewBox="0 0 64 64" fill="none" focusable="false">
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
      ) : id === 'dinner' ? (
        <span className="icon-dinner-wheel" />
      ) : id === 'sudoku' ? (
        <span className="icon-sudoku">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      ) : id === 'word' ? (
        <span className="icon-letters">
          {'WORD'.split('').map((letter) => (
            <i key={letter}>{letter}</i>
          ))}
        </span>
      ) : id === 'countdown' ? (
        <span className="icon-date">24</span>
      ) : (
        <Icon icon={icons[id]} />
      )}
    </span>
  )
}
export function WidgetPromoArt({ family = false }: { family?: boolean }) {
  return (
    <span className={'feature-art' + (family ? ' everyday-art' : '')} aria-hidden="true">
      {family ? (
        <>
          <span className="art-paper">
            <i />
            <i />
            <i />
          </span>
          <span className="art-app art-app--list">
            <Icon icon={ShoppingBasket} />
          </span>
          <span className="art-app art-app--poll">
            <Icon icon={Vote} />
          </span>
        </>
      ) : (
        <>
          <span className="art-wheel" />
          <span className="orbit-food">
            <Icon icon={Utensils} />
          </span>
        </>
      )}
    </span>
  )
}
export function WidgetPreviewArt({ id }: { id: WidgetStoreId }) {
  return (
    <div className={'gallery-scene gallery-scene--' + id} aria-hidden="true">
      {id === 'shopping' && (
        <span className="scene-paper">
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
      {id === 'polls' && (
        <span className="scene-ballot">
          <Icon icon={Vote} />
          <i />
          <i />
        </span>
      )}
      {id === 'dinner' ? (
        <>
          <span className="art-wheel" />
          <span className="scene-cutlery">
            <Icon icon={Utensils} />
          </span>
        </>
      ) : (
        <WidgetAppIcon id={id} />
      )}
    </div>
  )
}
