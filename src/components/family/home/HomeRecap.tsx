import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, History } from 'lucide-react'
import { homeRecapApi, type HomeRecapItem } from '../../../services/home-recap-query'
import { shoppingError } from '../../../services/shopping-query'
import { builtinWidgetPath } from '../../../features/widgets/builtin-widgets'
import { calendarEventPath } from '../../../features/calendar/calendar-selection'
import { useOnline } from '../../../hooks/useOnline'
import { Icon } from '../../ui/Icon'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { LoadingState } from '../../ui/LoadingState'
import './HomeRecap.css'

function sourcePath(item: HomeRecapItem) {
  return item.source === 'calendar' && item.startsAt
    ? calendarEventPath({ id: item.recordId, startsAt: item.startsAt, allDay: !!item.allDay })
    : builtinWidgetPath('shopping', 'show=all')
}

export function HomeRecap({ ownerId }: { ownerId: number }) {
  const online = useOnline()
  const [expanded, setExpanded] = useState(false)
  const disclosureId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLElement>(null)
  const query = homeRecapApi.useGetHomeRecapQuery(ownerId, {
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
  })
  const [review, mutation] = homeRecapApi.useReviewHomeRecapMutation()
  const returnFocus = useRef<HTMLElement | null>(null)
  const items = query.currentData?.items ?? []
  const error = shoppingError(mutation.error)?.message ?? shoppingError(query.error)?.message
  useEffect(() => {
    if (!items.length && returnFocus.current && !returnFocus.current.isConnected) {
      triggerRef.current?.focus()
      returnFocus.current = null
    }
  }, [items.length])
  useEffect(() => {
    if (!expanded) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        returnFocus.current = null
        setExpanded(false)
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && rootRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        setExpanded(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [expanded])
  const caughtUp = online && !query.isLoading && !!query.currentData && !items.length && !error
  const calendarCount = items.filter((item) => item.source === 'calendar').length
  const status = items.length
    ? `${items.length} new ${items.length === 1 ? 'update' : 'updates'}${error ? ' · Couldn’t refresh' : !online ? ' · Offline' : ''}`
    : error
      ? 'Couldn’t check updates'
      : !online
        ? 'Offline'
        : query.isLoading || !query.currentData
          ? 'Checking updates…'
          : 'You’re all caught up'
  return (
    <section
      ref={rootRef}
      className="home-recap"
      aria-label="Since your last visit"
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          setExpanded(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={'home-recap__tag' + (items.length ? ' home-recap__tag--new' : '')}
        aria-expanded={expanded}
        aria-controls={disclosureId}
        onClick={() => setExpanded((current) => !current)}
      >
        <Icon icon={History} />
        <span className="home-recap__tag-label">
          <span>Since your last visit</span>
          <span className="home-recap__status">{status}</span>
        </span>
        <Icon icon={ChevronDown} className="home-recap__chevron" />
      </button>
      <div
        id={disclosureId}
        className={'home-recap__disclosure' + (expanded ? ' home-recap__disclosure--open' : '')}
        inert={!expanded}
        aria-hidden={!expanded}
      >
        <div className="home-recap__clip">
          <div
            className={
              'content-surface home-recap__details' +
              (caughtUp ? ' home-recap__details--caught-up' : '')
            }
          >
            {query.isLoading && <LoadingState label="Checking family updates…" />}
            {error && (
              <div role="alert" className="home-recap__error">
                <p>{error}</p>
                <button
                  type="button"
                  className="secondary"
                  disabled={query.isFetching || mutation.isLoading}
                  onClick={() => {
                    mutation.reset()
                    void query.refetch()
                  }}
                >
                  {query.isFetching ? 'Checking…' : 'Try again'}
                </button>
              </div>
            )}
            {!online && (
              <p className="note">You’re offline. Reconnect to check and review updates.</p>
            )}
            {caughtUp && <p className="home-recap__caught-up">You’re all caught up.</p>}
            {!!items.length && (
              <>
                <p className="home-recap__categories">
                  Calendar {calendarCount} · Shopping {items.length - calendarCount}
                </p>
                <p className="home-recap__hint">
                  Latest change per item from other family members.
                </p>
                <ol className="home-recap__list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <span className="home-recap__meta">
                        {item.source === 'calendar' ? 'Calendar' : 'Shopping'} ·{' '}
                        <strong>{item.actor}</strong> · <FriendlyTime value={item.occurredAt} />
                      </span>
                      <p>
                        {item.change} “{item.title}”
                      </p>
                      <Link to={sourcePath(item)}>
                        {item.source === 'calendar' ? 'Open calendar' : 'Open shopping list'}
                      </Link>
                    </li>
                  ))}
                </ol>
                <div className="home-recap__actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={!online || mutation.isLoading || query.isFetching || !!query.error}
                    onBlur={() => {
                      returnFocus.current = null
                    }}
                    onClick={(event) => {
                      returnFocus.current =
                        document.activeElement === event.currentTarget ? event.currentTarget : null
                      if (query.currentData) void review({ throughId: query.currentData.throughId })
                    }}
                  >
                    {mutation.isLoading ? 'Marking reviewed…' : 'Mark reviewed'}
                  </button>
                  <span className="home-recap__hint">
                    Opening Home or a source keeps these updates here.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
