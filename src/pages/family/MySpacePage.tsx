import { lazy, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Grid2X2, Library, Plus, Users } from 'lucide-react'
import { useSudoku } from '../../features/sudoku/useSudoku'
import { useWidgets } from '../../features/widgets/useWidgets'
import { useEditingRecord } from '../../hooks/useEditingRecord'
import type { FamilyWidget } from '../../features/widgets/types'
import { PageHeader } from '../../components/ui/PageHeader'
import { Tabs } from '../../components/ui/Tabs'
import { Icon } from '../../components/ui/Icon'
import { ContentSurface } from '../../components/ui/ContentSurface'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { RefreshButton } from '../../components/ui/RefreshButton'
import { CollectionToolbar } from '../../components/ui/CollectionToolbar'
import { RemovalConfirmation } from '../../components/removals/RemovalConfirmation'
import { WidgetLibrary } from '../../components/widgets/WidgetLibrary'
import { WidgetShelf } from '../../components/widgets/WidgetShelf'
import { activeBuiltinWidget } from '../../features/widgets/builtin-widgets'
const SudokuWorkspace = lazy(() => import('../../components/sudoku/SudokuWorkspace'))
const SudokuInstall = lazy(() =>
  import('../../components/sudoku/SudokuInstall').then((module) => ({
    default: module.SudokuInstall,
  })),
)
const WidgetComposer = lazy(() => import('../../components/widgets/WidgetComposer'))
const tabs = [
  { id: 'library', label: 'Widget Library', icon: Library },
  { id: 'widgets', label: 'My widgets', icon: Grid2X2 },
  { id: 'family', label: 'Family widgets', icon: Users },
]
export default function MySpacePage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const {
    widgets,
    ownerId,
    loading,
    pending,
    feedback,
    error,
    failure,
    clearError,
    refresh,
    remove,
    mealRemoval,
    removals,
  } = useWidgets()
  const sudoku = useSudoku()
  const [installSudoku, setInstallSudoku] = useState(false)
  const [search, setSearch] = useSearchParams()
  const view = ['widgets', 'family'].includes(search.get('view') ?? '')
    ? search.get('view')!
    : 'library'
  const sudokuSelected = view === 'widgets' && search.get('tool') === 'sudoku'
  const builtin = activeBuiltinWidget(search)
  const builtinRequested = view === 'family' && (search.has('tool') || !!builtin)
  const inView = widgets.filter((widget) =>
    view === 'family' ? widget.visibility === 'family' : widget.owner.id === ownerId,
  )
  useEffect(() => {
    if (
      failure?.status === 401 ||
      failure?.code === 'password_change_required' ||
      sudoku.failure?.status === 401 ||
      sudoku.failure?.code === 'password_change_required'
    )
      onSessionExpired()
  }, [
    failure?.status,
    failure?.code,
    sudoku.failure?.status,
    sudoku.failure?.code,
    onSessionExpired,
  ])
  const editing = useEditingRecord(
    widgets.filter((widget) => !builtinRequested && !sudokuSelected && widget.owner.id === ownerId),
    builtinRequested || sudokuSelected ? null : search.get('edit'),
  )
  const removing = widgets.find(
    (widget) =>
      !builtinRequested &&
      !sudokuSelected &&
      widget.id === search.get('remove') &&
      widget.owner.id === ownerId,
  )
  const mealParent = widgets.find(
    (widget) =>
      !builtinRequested &&
      !sudokuSelected &&
      widget.owner.id === ownerId &&
      widget.meals.some((meal) => meal.id === search.get('removeMeal')),
  )
  const meal = mealParent?.meals.find((item) => item.id === search.get('removeMeal'))
  function change(values: Record<string, string>) {
    clearError()
    sudoku.clearError()
    setSearch((current) => {
      const next = new URLSearchParams(current)
      for (const key of ['compose', 'edit', 'remove', 'removeMeal']) next.delete(key)
      if (values.tool || values.widget || values.view || values.compose === 'spinner') {
        for (const key of ['q', 'sort', 'show']) next.delete(key)
      }
      if (values.widget || values.view || values.compose === 'spinner') next.delete('tool')
      if (
        values.tool ||
        values.compose === 'spinner' ||
        (values.view && values.view !== current.get('view'))
      )
        next.delete('widget')
      if (values.tool || values.widget || values.view || values.compose === 'spinner')
        for (const key of ['meal', 'mealDate', 'mealType']) next.delete(key)
      for (const [key, value] of Object.entries(values)) next.set(key, value)
      return next
    })
  }
  const edit = (widget: FamilyWidget) => change({ edit: widget.id })
  const missing =
    !loading &&
    !error &&
    !builtinRequested &&
    !sudokuSelected &&
    ((search.has('edit') && !editing) ||
      (search.has('remove') && !removing) ||
      (search.has('removeMeal') && !meal))
  return (
    <div className={'page-stack page-enter' + (view === 'library' ? ' widget-store-page' : '')}>
      <PageHeader
        title={builtin?.title ?? 'Widget Store'}
        description={builtin?.description ?? 'Little apps for everyday family life.'}
        action={
          view === 'library' ? (
            <RefreshButton
              label="Refresh your widgets"
              disabled={pending || sudoku.pending}
              onClick={() => {
                refresh()
                sudoku.refresh()
              }}
            />
          ) : (
            <button type="button" onClick={() => change({ view: 'library' })}>
              <Icon icon={Plus} />
              Browse the store
            </button>
          )
        }
      />
      <Tabs
        items={tabs}
        value={view}
        onChange={(value) => change({ view: value })}
        label="Widget sections"
      >
        {!builtin && view !== 'library' && (
          <CollectionToolbar
            label="Refresh your widgets"
            busy={pending}
            feedback={feedback}
            onRefresh={refresh}
          >
            <p className="note">
              {view === 'family'
                ? 'Your shared family tools, plus setups shared by their owners.'
                : 'Your saved setups. Choose which ones to keep personal or share with family.'}
            </p>
          </CollectionToolbar>
        )}
        {view === 'library' && feedback && (
          <p className="note" role="status">
            {feedback}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {view === 'library' ? (
          <WidgetLibrary
            onAdd={() => change({ compose: 'spinner' })}
            installations={widgets.filter((widget) => !removals[widget.id])}
            loading={loading}
            error={!!error}
            sudoku={{
              installed: !!sudoku.game && !sudoku.removals[sudoku.game.id],
              ready: sudoku.known && !sudoku.error,
              loading: sudoku.loading,
              removing: !!(sudoku.game && sudoku.removals[sudoku.game.id]),
              onInstall: () => setInstallSudoku(true),
            }}
          />
        ) : builtinRequested && !builtin ? (
          <ContentSurface>
            <h2>This family tool isn’t available</h2>
            <button type="button" onClick={() => change({ view: 'family' })}>
              Open Family widgets
            </button>
          </ContentSurface>
        ) : loading && !builtin ? (
          <LoadingState label="Opening your widgets…" />
        ) : (
          <>
            {view !== 'family' &&
              !sudokuSelected &&
              !sudoku.game &&
              !error &&
              !inView.some((widget) => !widget.hidden) && (
                <ContentSurface>
                  <EmptyState icon={Grid2X2} title="No widgets installed yet">
                    <p>
                      Browse the Widget Library and add Dinner Spinner to create your own meal
                      choices.
                    </p>
                    <button type="button" onClick={() => change({ view: 'library' })}>
                      Explore the library
                    </button>
                  </EmptyState>
                </ContentSurface>
              )}
            <WidgetShelf
              extraShelfItem={
                view === 'widgets' && sudoku.game ? (
                  <button
                    type="button"
                    className="secondary"
                    aria-pressed={sudokuSelected}
                    onClick={() => change({ view: 'widgets', tool: 'sudoku' })}
                    disabled={!!sudoku.removals[sudoku.game.id]}
                  >
                    <Icon icon={Grid2X2} />
                    <span>
                      <strong>Sudoku</strong>
                      <small>Installed · Personal</small>
                    </span>
                  </button>
                ) : undefined
              }
              alternateContent={
                sudokuSelected ? (
                  <Suspense fallback={<LoadingState label="Opening Sudoku…" />}>
                    <SudokuWorkspace
                      key={sudoku.ownerId ?? 'signed-out'}
                      onInstall={() => setInstallSudoku(true)}
                      onExit={() => change({ view: 'widgets' })}
                    />
                  </Suspense>
                ) : undefined
              }
              scope={view === 'family' ? 'family' : 'mine'}
              selectedId={search.get('widget') ?? ''}
              onSelect={(id) => change({ widget: id })}
              onEdit={edit}
              onRemove={(widget) => change({ remove: widget.id })}
              builtin={builtin}
              onBuiltinSelect={(id) => change({ view: 'family', tool: id })}
            />
          </>
        )}
      </Tabs>
      {installSudoku && (
        <Suspense fallback={<LoadingState label="Opening Sudoku installation…" />}>
          <SudokuInstall
            key={sudoku.ownerId ?? 'signed-out'}
            onClose={() => setInstallSudoku(false)}
            onInstalled={() => {
              setInstallSudoku(false)
              change({ view: 'widgets', tool: 'sudoku' })
            }}
          />
        </Suspense>
      )}
      {missing && (
        <p role="status">
          This widget or meal is no longer available.{' '}
          <button type="button" className="secondary" onClick={() => change({})}>
            Back to Widgets
          </button>
        </p>
      )}
      {!builtinRequested && !sudokuSelected && (search.get('compose') === 'spinner' || editing) && (
        <Suspense fallback={<LoadingState label="Opening widget settings…" />}>
          <WidgetComposer
            key={editing?.id ?? 'new'}
            widget={editing}
            onClose={() => change({})}
            onSaved={() => change({ view: 'widgets' })}
            onRemoveMeal={(meal) => change({ removeMeal: meal.id })}
          />
        </Suspense>
      )}
      {removing && (
        <RemovalConfirmation
          item={removing}
          noun="widget"
          history={
            removing.visibility === 'family'
              ? 'This removes the installation from Family widgets for everyone. Saved trials, suggestions and replies remain in database history.'
              : 'Its saved trials remain in database history.'
          }
          busy={pending}
          error={error}
          schedule={remove}
          onClose={() => change({})}
        />
      )}
      {meal && mealParent && (
        <RemovalConfirmation
          item={{ ...meal, version: mealParent.version }}
          noun="meal"
          history="Previous picks keep their original meal names."
          busy={pending}
          error={error}
          schedule={mealRemoval.remove}
          onClose={() => change({})}
        />
      )}
    </div>
  )
}
