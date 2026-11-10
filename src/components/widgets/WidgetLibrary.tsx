import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { FOCUS_PATH } from '../../features/focus-timer/types'
import { WORD_PATH } from '../../features/daily-word/types'
import { NONOGRAM_PATH } from '../../features/nonograms/types'
import { SUDOKU_PATH } from '../../features/sudoku/types'
import { Search } from 'lucide-react'
import { builtinWidgetPath } from '../../features/widgets/builtin-widgets'
import {
  widgetCatalogue,
  widgetInstallationPath,
  type WidgetStoreApp,
} from '../../features/widgets/widget-catalogue'
import type { FamilyWidget } from '../../features/widgets/types'
import { Icon } from '../ui/Icon'
import { HorizontalScroll } from '../ui/HorizontalScroll'
import { WidgetAppIcon, WidgetPromoArt } from './WidgetStoreArt'
import { WidgetStoreDetails } from './WidgetStoreDetails'
import './WidgetLibrary.css'

const categories = [
  ['all', 'Discover'],
  ['family', 'Family'],
  ['games', 'Games'],
  ['tools', 'Tools'],
] as const
function StoreSection({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <section className="store-section">
      <header className="store-section-head">
        <h2>{title}</h2>
        <p>{note}</p>
      </header>
      {children}
    </section>
  )
}
export function WidgetLibrary({
  onAdd,
  onAddWhere,
  onShow,
  pending = false,
  installations,
  loading,
  error,
  nonograms,
  sudoku,
  word,
  focus,
}: {
  onAdd: () => void
  onAddWhere: () => void
  onShow: (widget: FamilyWidget) => void
  pending?: boolean
  installations: FamilyWidget[]
  loading: boolean
  error: boolean
  focus?: {
    installed: boolean
    ready: boolean
    loading: boolean
    removing: boolean
    onInstall: () => void
  }
  word?: {
    installed: boolean
    ready: boolean
    loading: boolean
    removing: boolean
    onInstall: () => void
  }
  nonograms?: {
    installed: boolean
    ready: boolean
    loading: boolean
    removing: boolean
    onInstall: () => void
  }
  sudoku?: {
    installed: boolean
    ready: boolean
    loading: boolean
    removing: boolean
    onInstall: () => void
  }
}) {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [resultStatus, setResultStatus] = useState('')
  const [selected, setSelected] = useState<WidgetStoreApp | null>(null)
  const ready = !loading && !error
  const dinnerInstallations = installations.filter((widget) => widget.kind === 'dinner-spinner')
  const firstInstallation = dinnerInstallations.find((widget) => !widget.hidden)
  const personal = dinnerInstallations.filter((widget) => widget.visibility === 'private').length
  const family = dinnerInstallations.filter((widget) => widget.visibility === 'family').length
  const dinnerStatus = !ready
    ? loading
      ? 'Checking installations…'
      : 'Installation status unavailable'
    : dinnerInstallations.length
      ? `Installed · ${personal} personal, ${family} family`
      : 'Available · Personal or family'
  const filtered = widgetCatalogue.filter(
    (app) =>
      (category === 'all' || app.category === category) &&
      (app.title + ' ' + app.subtitle)
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  )
  const builtins = filtered.filter((app) => app.availability === 'installed')
  const available = filtered.filter((app) => app.availability === 'available')
  const proposed = filtered.filter((app) => app.availability === 'proposed')
  const resultSummary = `${filtered.length ? `${filtered.length} ${filtered.length === 1 ? 'widget' : 'widgets'} found` : 'No matching widgets'}${query.trim() ? ` for “${query.trim()}”` : ''}.`
  useEffect(() => {
    const timer = window.setTimeout(() => setResultStatus(resultSummary), 300)
    return () => window.clearTimeout(timer)
  }, [resultSummary])
  function install() {
    setSelected(null)
    onAdd()
  }
  const personalFor = (id: string) =>
    id === 'nonograms' ? nonograms : id === 'focus' ? focus : id === 'word' ? word : sudoku
  function selectApp(id: WidgetStoreApp['id']) {
    setSelected(widgetCatalogue.find((app) => app.id === id) ?? null)
  }
  function showAction(widget: FamilyWidget, title: string) {
    return (
      <button
        type="button"
        className="pill-action"
        disabled={!ready || pending}
        aria-label={'Show ' + title + ' on shelf'}
        onClick={() => onShow(widget)}
      >
        SHOW ON SHELF
      </button>
    )
  }
  function action(app: WidgetStoreApp) {
    if (app.id === 'where') {
      const available = installations.filter((widget) => widget.kind === 'where-is-it')
      const visible = available.find((widget) => !widget.hidden)
      return visible ? (
        <Link
          className="pill-action"
          to={widgetInstallationPath(visible)}
          onClick={() => setSelected(null)}
          aria-label="Open Where Is It?"
        >
          OPEN
        </Link>
      ) : available.length ? (
        showAction(available[0], app.title)
      ) : (
        <button
          type="button"
          className="pill-action"
          disabled={!ready}
          aria-label="Install Where Is It?"
          onClick={() => {
            setSelected(null)
            onAddWhere()
          }}
        >
          INSTALL
        </button>
      )
    }
    if (app.id === 'nonograms' || app.id === 'sudoku' || app.id === 'word' || app.id === 'focus') {
      const personal = personalFor(app.id)
      return personal?.installed ? (
        <Link
          className="pill-action"
          to={
            app.id === 'nonograms'
              ? NONOGRAM_PATH
              : app.id === 'focus'
                ? FOCUS_PATH
                : app.id === 'word'
                  ? WORD_PATH
                  : SUDOKU_PATH
          }
          onClick={() => setSelected(null)}
          aria-label={'Open ' + app.title}
        >
          OPEN
        </Link>
      ) : (
        <button
          type="button"
          className="pill-action"
          disabled={!personal?.ready || personal.removing}
          onClick={() => {
            setSelected(null)
            personal?.onInstall()
          }}
          aria-label={'Install ' + app.title}
        >
          {personal?.removing
            ? 'REMOVING'
            : personal?.ready
              ? 'INSTALL'
              : personal?.loading
                ? 'LOADING'
                : 'UNAVAILABLE'}
        </button>
      )
    }
    if (app.availability === 'proposed')
      return <span className="pill-action pill-action--proposed">PROPOSED</span>
    if (app.id === 'dinner' && dinnerInstallations.length && !firstInstallation)
      return showAction(dinnerInstallations[0], app.title)
    const path =
      app.id === 'shopping' || app.id === 'polls' || app.id === 'jobs'
        ? builtinWidgetPath(app.id)
        : firstInstallation
          ? widgetInstallationPath(firstInstallation)
          : null
    if (app.id !== 'dinner' || (ready && path))
      return (
        <Link
          className="pill-action"
          to={path!}
          onClick={() => setSelected(null)}
          aria-label={'Open ' + app.title}
        >
          OPEN
        </Link>
      )
    return (
      <button
        type="button"
        className="pill-action"
        onClick={install}
        disabled={!ready}
        aria-label={'Install ' + app.title}
      >
        {ready ? 'INSTALL' : loading ? 'LOADING' : 'UNAVAILABLE'}
      </button>
    )
  }
  function row(app: WidgetStoreApp) {
    return (
      <article className="app-row" key={app.id}>
        <button
          type="button"
          className="app-icon-button"
          onClick={() => setSelected(app)}
          aria-label={'About ' + app.title}
        >
          <WidgetAppIcon id={app.id} />
        </button>
        <button type="button" className="app-pick" onClick={() => setSelected(app)}>
          <span className="app-name">{app.title}</span>
          <span className="app-subtitle">{app.subtitle}</span>
          <span className="app-scope">
            {app.id === 'where'
              ? installations.some((widget) => widget.kind === 'where-is-it')
                ? 'Installed · Personal or family'
                : 'Available · Personal or family'
              : app.id === 'dinner'
                ? dinnerStatus
                : app.id === 'nonograms' ||
                    app.id === 'sudoku' ||
                    app.id === 'word' ||
                    app.id === 'focus'
                  ? personalFor(app.id)?.installed
                    ? 'Installed · Personal'
                    : personalFor(app.id)?.removing
                      ? 'Removal pending · Undo available'
                      : personalFor(app.id)?.ready
                        ? 'Available · Personal only'
                        : personalFor(app.id)?.loading
                          ? 'Checking installation…'
                          : 'Installation status unavailable'
                  : 'Installed · Shared family tool'}
          </span>
        </button>
        {action(app)}
      </article>
    )
  }
  return (
    <div className="widget-store">
      <div className="store-toolbar">
        <div className="category-chips" role="group" aria-label="Widget categories">
          {categories.map(([id, label]) => (
            <button
              type="button"
              key={id}
              onClick={() => setCategory(id)}
              aria-pressed={category === id}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="store-search">
          <Icon icon={Search} />
          <input
            type="search"
            placeholder="Search the store"
            aria-label="Search widgets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p role="status" className="sr-only">
        {resultStatus}
      </p>
      {category === 'all' && !query.trim() && (
        <HorizontalScroll className="store-features" label="Featured widgets">
          <div className="feature-shelf">
            <button type="button" className="store-feature" onClick={() => selectApp('dinner')}>
              <span>
                <span className="feature-kicker">Featured app</span>
                <strong>
                  Give dinner
                  <br />a fresh spin.
                </strong>
                <span className="feature-caption">
                  A little inspiration.
                  <br />A choice to share.
                </span>
              </span>
              <WidgetPromoArt />
              <span className="feature-app">
                <WidgetAppIcon id="dinner" />
                <span>
                  <b>Dinner Spinner</b>
                  {ready && dinnerInstallations.length
                    ? 'Installed · Open your choices'
                    : 'Personal or family'}
                </span>
              </span>
            </button>
            <article className="store-feature store-feature--everyday">
              <span>
                <span className="feature-kicker">Everyday family essentials</span>
                <strong>
                  Life’s little
                  <br />
                  things, together.
                </strong>
                <span className="feature-caption">
                  Shopping List &amp; Polls.
                  <br />
                  Already part of the family.
                </span>
              </span>
              <WidgetPromoArt family />
              <span className="feature-app">
                <WidgetAppIcon id="shopping" />
                <span>
                  <b>Built for sharing</b>2 installed family apps
                </span>
              </span>
              <div className="feature-choices" role="group" aria-label="Explore family essentials">
                <button type="button" className="secondary" onClick={() => selectApp('shopping')}>
                  Explore Shopping List
                </button>
                <button type="button" className="secondary" onClick={() => selectApp('polls')}>
                  Explore Polls
                </button>
              </div>
            </article>
          </div>
        </HorizontalScroll>
      )}
      {builtins.length > 0 && (
        <StoreSection title="Installed for the family" note="Ready to open">
          <div className="app-rows">{builtins.map(row)}</div>
        </StoreSection>
      )}
      {available.length > 0 && (
        <StoreSection title="Personal and family apps" note="Install or open">
          <div className="app-rows">{available.map(row)}</div>
        </StoreSection>
      )}
      {proposed.length > 0 && (
        <StoreSection title="Coming later" note="Proposed ideas">
          <p className="proposal-caption">
            Ideas for future apps. Not available to install or use.
          </p>
          <HorizontalScroll className="store-proposals" label="Proposed widgets">
            <div className="icon-covers">
              {proposed.map((app) => (
                <button
                  type="button"
                  key={app.id}
                  className="icon-cover"
                  onClick={() => setSelected(app)}
                >
                  <WidgetAppIcon id={app.id} />
                  <span>
                    <span className="app-name">{app.title}</span>
                    <span className="app-subtitle">
                      {app.category === 'family'
                        ? 'Family'
                        : app.category === 'games'
                          ? 'Games'
                          : 'Tools'}{' '}
                      · Proposed
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </HorizontalScroll>
        </StoreSection>
      )}
      {filtered.length === 0 && (
        <div className="empty-store">
          <h2>No matching widgets</h2>
          <p>Try another name or category.</p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {selected && (
        <WidgetStoreDetails
          app={selected}
          installations={installations.filter(
            (widget) =>
              widget.kind === (selected.id === 'where' ? 'where-is-it' : 'dinner-spinner'),
          )}
          ready={
            selected.id === 'nonograms' ||
            selected.id === 'sudoku' ||
            selected.id === 'word' ||
            selected.id === 'focus'
              ? !!personalFor(selected.id)?.ready
              : ready
          }
          visibility={
            selected.id === 'nonograms' ||
            selected.id === 'sudoku' ||
            selected.id === 'word' ||
            selected.id === 'focus'
              ? 'Personal only'
              : undefined
          }
          availability={
            selected.id === 'nonograms' ||
            selected.id === 'sudoku' ||
            selected.id === 'word' ||
            selected.id === 'focus'
              ? !personalFor(selected.id)?.ready
                ? personalFor(selected.id)?.loading
                  ? 'Checking status'
                  : 'Status unavailable'
                : personalFor(selected.id)!.installed
                  ? 'Installed'
                  : personalFor(selected.id)!.removing
                    ? 'Removal pending'
                    : 'Available'
              : undefined
          }
          loading={
            selected.id === 'nonograms' ||
            selected.id === 'sudoku' ||
            selected.id === 'word' ||
            selected.id === 'focus'
              ? !!personalFor(selected.id)?.loading
              : loading
          }
          action={action(selected)}
          onShow={onShow}
          pending={pending}
          onClose={() => setSelected(null)}
          onInstall={
            selected.id === 'where'
              ? () => {
                  setSelected(null)
                  onAddWhere()
                }
              : install
          }
        />
      )}
    </div>
  )
}
