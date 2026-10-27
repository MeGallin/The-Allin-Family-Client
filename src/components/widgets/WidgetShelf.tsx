import { lazy, Suspense, useState, type ReactNode } from 'react'
import { EyeOff, Settings2, Trash2, Utensils } from 'lucide-react'
import type { FamilyWidget } from '../../features/widgets/types'
import { useWidgets } from '../../features/widgets/useWidgets'
import { ContentSurface } from '../ui/ContentSurface'
import { HorizontalScroll } from '../ui/HorizontalScroll'
import { Icon } from '../ui/Icon'
import { RemovalNotice } from '../removals/RemovalNotice'
import { DinnerSpinner } from './DinnerSpinner'
import { WidgetVisibility } from './WidgetVisibility'
import { WidgetHistory } from './WidgetHistory'
import { PublishedDinner } from './PublishedDinner'
import { MealDiary } from './MealDiary'
import { WidgetMeals } from './WidgetMeals'
import { familyMeals } from '../../features/widgets/meal-diary'
import {
  builtinWidgets,
  type BuiltinWidget,
  type BuiltinWidgetId,
} from '../../features/widgets/builtin-widgets'
import { LoadingState } from '../ui/LoadingState'
import './WidgetShelf.css'
const JobsWidget = lazy(() => import('../household-jobs/HouseholdJobs'))
const ShoppingWidget = lazy(() => import('../../pages/family/ListsPage'))
const PollsWidget = lazy(() => import('../../pages/family/PollsPage'))
export function WidgetShelf({
  scope,
  selectedId,
  onSelect,
  onEdit,
  onRemove,
  builtin,
  onBuiltinSelect,
  extraShelfItem,
  alternateContent,
  compactShelf = false,
}: {
  scope: 'mine' | 'family'
  selectedId: string
  onSelect: (id: string) => void
  onEdit: (widget: FamilyWidget) => void
  onRemove: (widget: FamilyWidget) => void
  builtin?: BuiltinWidget
  extraShelfItem?: ReactNode
  alternateContent?: ReactNode
  compactShelf?: boolean
  onBuiltinSelect: (id: BuiltinWidgetId) => void
}) {
  const { widgets, ownerId, pending, offline, spin, hide, removals, mealRemoval } = useWidgets()
  const scoped = widgets.filter((widget) =>
    scope === 'family' ? widget.visibility === 'family' : widget.owner.id === ownerId,
  )
  const visible = scoped.filter((widget) => !widget.hidden)
  const selected =
    builtin || alternateContent
      ? undefined
      : selectedId
        ? visible.find((widget) => widget.id === selectedId)
        : visible[0]
  const own = selected?.owner.id === ownerId
  const removal = selected && removals[selected.id]
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="widget-shelf">
      {(scope === 'family' || visible.length > 0 || !!extraShelfItem) && (
        <details
          className={'widget-shelf__chooser' + (compactShelf ? ' is-compact' : '')}
          open={compactShelf ? undefined : true}
        >
          <summary>Choose another widget</summary>
          <HorizontalScroll className="widget-shelf__scroller" label="Your widget shelf">
            <div className="widget-shelf__collection">
              {extraShelfItem}
              {scope === 'family' &&
                builtinWidgets.map((widget) => (
                  <button
                    type="button"
                    className="secondary"
                    key={widget.id}
                    aria-pressed={builtin?.id === widget.id}
                    onClick={() => onBuiltinSelect(widget.id)}
                  >
                    <Icon icon={widget.icon} />
                    <span>
                      <strong>{widget.title}</strong>
                      <small>Installed · Family</small>
                    </span>
                  </button>
                ))}
              {visible.map((widget) => (
                <button
                  type="button"
                  className="secondary"
                  key={widget.id}
                  aria-pressed={widget.id === selected?.id}
                  onClick={() => onSelect(widget.id)}
                >
                  <Icon icon={Utensils} />
                  <span>
                    <strong>{widget.title}</strong>
                    <small>
                      {widget.owner.id === ownerId
                        ? 'Your wheel'
                        : 'Shared by ' + widget.owner.name}{' '}
                      · {widget.visibility === 'private' ? 'Personal' : 'Family'}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </HorizontalScroll>
        </details>
      )}
      {alternateContent}
      {builtin && (
        <section aria-label={builtin.title}>
          <Suspense fallback={<LoadingState label={'Opening ' + builtin.title + '…'} />}>
            {builtin.id === 'jobs' ? (
              <JobsWidget />
            ) : builtin.id === 'shopping' ? (
              <ShoppingWidget embedded />
            ) : (
              <PollsWidget embedded />
            )}
          </Suspense>
        </section>
      )}
      {selectedId && !selected && !builtin && !alternateContent && (
        <ContentSurface>
          <h2>This widget isn’t available here</h2>
          <p className="note">
            It may have been hidden, made personal or removed. Choose a widget from the shelf.
          </p>
          {visible[0] && (
            <button type="button" className="secondary" onClick={() => onSelect(visible[0].id)}>
              Open an available widget
            </button>
          )}
        </ContentSurface>
      )}
      {selected && (
        <>
          <div className="widget-shelf__layout">
            <div className="widget-shelf__main">
              <ContentSurface className="widget-shelf__play">
                <div className="widget-shelf__section-heading">
                  <p className="eyebrow">Your private spin</p>
                  <span className="note">{selected.meals.length} meals</span>
                </div>
                <RemovalNotice removal={removal} />
                <DinnerSpinner
                  key={selected.id}
                  widget={selected}
                  disabled={
                    pending ||
                    offline ||
                    !!removal ||
                    Object.values(mealRemoval.removals).some((entry) =>
                      selected.meals.some((meal) => meal.id === entry.item.id),
                    )
                  }
                  onViewMeals={() => setMenuOpen(true)}
                  onSpin={(key) => spin(selected, key)}
                />
              </ContentSurface>
            </div>
            <aside
              className="widget-shelf__table"
              aria-label={
                selected.visibility === 'family'
                  ? 'Published family meal'
                  : 'Personal widget information'
              }
            >
              {selected.visibility === 'family' || selected.publications.length > 0 ? (
                <PublishedDinner widget={selected} disabled={!!removal} />
              ) : (
                <ContentSurface>
                  <p className="eyebrow">Just for you</p>
                  <h2>Your own little dinner decider.</h2>
                  <p className="note">
                    Your meals and trials stay personal. Spin as often as you like, or choose Family
                    in Widget settings when you want everyone to join in.
                  </p>
                </ContentSurface>
              )}
              <p className="note widget-shelf__table-note">
                {selected.visibility === 'family'
                  ? 'Spinning stays private. Only publishing changes the family’s meal.'
                  : 'Personal installation. Choose Family in Widget settings to share a meal.'}
              </p>
            </aside>
          </div>
          {selected.publications.length > 0 && (
            <MealDiary entries={familyMeals([selected])} layout="board" />
          )}
          <div className="widget-shelf__support">
            <details className="widget-shelf__details">
              <summary>Ownership & settings</summary>
              <ContentSurface>
                <p className="eyebrow">{own ? 'Your installation' : 'Family installation'}</p>
                <div className="widget-shelf__owner">
                  <span>{Array.from(selected.owner.name)[0]}</span>
                  <div>
                    <strong>{selected.owner.name}</strong>
                    <p className="note">Owner · Dinner Spinner</p>
                  </div>
                </div>
                <WidgetVisibility visibility={selected.visibility} />
                <p className="note">
                  {own
                    ? selected.visibility === 'family'
                      ? 'Everyone can spin privately and publish suggestions. You control the meals.'
                      : 'Only you can see and use this wheel.'
                    : 'Spin privately, then publish your choice for the family to respond. The owner manages the meals.'}
                </p>
                {own ? (
                  <div className="widget-shelf__controls">
                    <button
                      className="secondary"
                      type="button"
                      disabled={pending || !!removal}
                      onClick={() => onEdit(selected)}
                    >
                      <Icon icon={Settings2} />
                      Widget settings
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      disabled={pending || !!removal}
                      onClick={() => onRemove(selected)}
                    >
                      <Icon icon={Trash2} />
                      Remove widget
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="secondary"
                    disabled={pending}
                    onClick={() => void hide(selected, true)}
                  >
                    <Icon icon={EyeOff} />
                    Hide for me
                  </button>
                )}
              </ContentSurface>
            </details>
            <details className="widget-shelf__details">
              <summary>Your private trial history</summary>
              <WidgetHistory key={selected.id} spins={selected.spins} />
            </details>
          </div>
          {menuOpen && (
            <WidgetMeals key={selected.id} widget={selected} onClose={() => setMenuOpen(false)} />
          )}
        </>
      )}
      {scoped.some((widget) => widget.hidden) && (
        <ContentSurface>
          <h2 className="widget-shelf__minor-title">Hidden family widgets</h2>
          <p className="note">
            Hiding affects only your view; it does not remove the owner’s widget.
          </p>
          <div className="widget-shelf__hidden">
            {scoped
              .filter((widget) => widget.hidden)
              .map((widget) => (
                <button
                  type="button"
                  className="secondary"
                  key={widget.id}
                  disabled={pending}
                  onClick={() => void hide(widget, false)}
                >
                  Show {widget.title} · {widget.owner.name}
                </button>
              ))}
          </div>
        </ContentSurface>
      )}
    </div>
  )
}
