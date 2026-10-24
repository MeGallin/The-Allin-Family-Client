import { CalendarDays, Grid2X2, Plus, Puzzle, Timer, Utensils } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { ContentSurface } from '../ui/ContentSurface'
import { DinnerWheel } from './DinnerWheel'
import './WidgetLibrary.css'
const planned = [
  {
    title: 'Sudoku',
    icon: Grid2X2,
    copy: 'A quiet challenge at your own pace, with saved progress.',
  },
  {
    title: 'Focus Timer',
    icon: Timer,
    copy: 'Make a little space to concentrate, then take a gentle break.',
  },
  {
    title: 'Daily Word',
    icon: Puzzle,
    copy: 'A small daily word challenge to keep your mind moving.',
  },
  {
    title: 'Countdowns',
    icon: CalendarDays,
    copy: 'Keep something you’re looking forward to close at hand.',
  },
]
export function WidgetLibrary({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="widget-library">
      <ContentSurface className="widget-library__featured">
        <div>
          <p className="eyebrow">First in the library</p>
          <h2>Dinner, with a twist.</h2>
          <p>
            Install your own meal wheel or one for the family. Try private spins, then publish a
            suggestion everyone can respond to.
          </p>
          <button type="button" onClick={onAdd}>
            <Icon icon={Plus} />
            Install Dinner Spinner
          </button>
          <p className="note">
            Each installation has its own meal list. Trial picks stay private; only published
            suggestions are shared.
          </p>
        </div>
        <DinnerWheel
          compact
          meals={[
            { title: 'Your meals' },
            { title: 'Your choices' },
            { title: 'One pick' },
            { title: 'Together' },
          ]}
        />
      </ContentSurface>
      <div className="widget-library__catalogue">
        <ContentSurface>
          <Icon icon={Utensils} />
          <h3>Dinner Spinner</h3>
          <p>
            Equal chances. Private trials. Published dinner suggestions with clear family replies.
          </p>
          <span className="note">Available · Personal or family</span>
          <button className="secondary" type="button" onClick={onAdd}>
            <Icon icon={Plus} />
            Install widget
          </button>
        </ContentSurface>
        {planned.map((item) => (
          <ContentSurface key={item.title} className="widget-library__planned">
            <span className="widget-library__proposal">Proposed</span>
            <Icon icon={item.icon} />
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </ContentSurface>
        ))}
      </div>
    </div>
  )
}
