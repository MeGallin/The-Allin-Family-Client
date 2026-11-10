import { useState } from 'react'
import { MapPin, Package, Plus, Search, Settings2 } from 'lucide-react'
import type { FamilyWidget } from '../../features/widgets/types'
import { useWidgets } from '../../features/widgets/useWidgets'
import { useWhereItems } from '../../features/where-is-it/useWhereItems'
import { wherePhoto, type WhereItem } from '../../features/where-is-it/types'
import { ContentSurface } from '../ui/ContentSurface'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { FriendlyTime } from '../ui/FriendlyTime'
import { LoadingState } from '../ui/LoadingState'
import { RefreshButton } from '../ui/RefreshButton'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
import { RemovalNotice } from '../removals/RemovalNotice'
import { WhereItemForm } from './WhereItemForm'
import './WhereIsItWorkspace.css'

const normal = (text: string) => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
export default function WhereIsItWorkspace({
  widget,
  onEdit,
  onRemove,
}: {
  widget: FamilyWidget
  onEdit: () => void
  onRemove: () => void
}) {
  const api = useWhereItems()
  const installations = useWidgets()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [selected, setSelected] = useState<string>()
  const [editing, setEditing] = useState<WhereItem | 'new'>()
  const [removing, setRemoving] = useState<string>()
  const [photoFailed, setPhotoFailed] = useState(false)
  const items = api.items.filter((item) => item.widgetId === widget.id && !api.removals[item.id])
  const locations = [
    ...new Map(items.map((item) => [normal(item.location), item.location])).values(),
  ].sort((a, b) => a.localeCompare(b))
  const results = items
    .filter(
      (item) =>
        (!location || normal(item.location) === normal(location)) &&
        normal(item.title + ' ' + item.location + ' ' + item.note).includes(normal(query)),
    )
    .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
  const detail = selected ? items.find((item) => item.id === selected) : undefined
  const removal = api.items.find((item) => item.id === removing)
  const installationRemoval = installations.removals[widget.id]
  const disabled = api.pending || api.offline || !!installationRemoval
  return (
    <ContentSurface className="where-index">
      <div className="where-heading">
        <div>
          <h2>Find an item</h2>
          <p className="note">Search by its name, location or note.</p>
        </div>
        <div className="actions">
          <RefreshButton label="Refresh items" disabled={api.pending} onClick={api.refresh} />
          <button type="button" disabled={disabled || !api.known} onClick={() => setEditing('new')}>
            Add item <Icon icon={Plus} />
          </button>
        </div>
      </div>
      <RemovalNotice removal={installationRemoval} />
      {api.error && (
        <p className="error" role="alert">
          {api.error}
        </p>
      )}
      <div className="where-controls">
        <label className="where-search">
          <span className="sr-only">Search items</span>
          <Icon icon={Search} />
          <input
            type="search"
            value={query}
            placeholder="Search household items"
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="where-filter">
          Location
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All locations</option>
            {locations.map((place) => (
              <option key={place}>{place}</option>
            ))}
          </select>
        </label>
      </div>
      {api.loading ? (
        <LoadingState label="Loading items…" />
      ) : (
        api.known && (
          <>
            <p className="note" role="status">
              {results.length} {results.length === 1 ? 'item' : 'items'}
              {query || location ? ' found' : ' saved'}
            </p>
            {items.length === 0 && !query && !location ? (
              <div className="where-empty">
                <Icon icon={Package} />
                <h3>Remember where you put it</h3>
                <p className="note">
                  Add an item’s name and location so it’s easy to find next time.
                </p>
                <button type="button" disabled={disabled} onClick={() => setEditing('new')}>
                  Add your first item
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="where-empty">
                <h3>No matching items</h3>
                <p className="note">Try another name, location or detail.</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setQuery('')
                    setLocation('')
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="where-list">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="where-row"
                      onClick={() => {
                        setPhotoFailed(false)
                        setSelected(item.id)
                      }}
                    >
                      <span className="where-row__glyph">
                        <Icon icon={item.photoKey ? Package : MapPin} />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <span className="where-row__location">{item.location}</span>
                      </span>
                      <span className="where-row__open" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}
      <details className="where-settings">
        <summary>Ownership &amp; settings</summary>
        <p className="note">{widget.owner.name} · Installation owner</p>
        <p className="note">
          {widget.visibility === 'family'
            ? 'Family members can find, add, edit and remove shared items.'
            : 'Personal collection. Only you can see these items and photos.'}
        </p>
        {widget.owner.id === installations.ownerId && (
          <div className="actions">
            <button type="button" className="secondary" disabled={disabled} onClick={onEdit}>
              <Icon icon={Settings2} /> Collection settings
            </button>
            <button type="button" className="secondary" disabled={disabled} onClick={onRemove}>
              Remove installation
            </button>
          </div>
        )}
      </details>
      {selected && !detail && (
        <p role="status" className="note">
          This item is no longer available.
        </p>
      )}
      {detail && (
        <Modal
          title={detail.title}
          scrollable
          onClose={() => setSelected(undefined)}
          className="where-dialog"
        >
          <p className="eyebrow">Location</p>
          <p className="where-detail-location">
            <Icon icon={MapPin} />
            {detail.location}
          </p>
          {detail.photoKey && !photoFailed ? (
            <img
              className="where-photo"
              src={wherePhoto(detail)}
              alt={'Photo of ' + detail.title}
              width={640}
              height={400}
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <p className="where-no-photo note">
              {photoFailed ? 'Photo unavailable. Refresh to try again.' : 'No photo added'}
            </p>
          )}
          {detail.note && <p className="where-note">{detail.note}</p>}
          <p className="note">
            Updated <FriendlyTime value={detail.updatedAt} />
          </p>
          <div className="actions">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setEditing(detail)
                setSelected(undefined)
              }}
            >
              Edit / move item
            </button>
            <button
              type="button"
              className="secondary"
              disabled={disabled}
              onClick={() => {
                setRemoving(detail.id)
                setSelected(undefined)
              }}
            >
              Remove item
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <WhereItemForm
          widgetId={widget.id}
          item={editing === 'new' ? undefined : editing}
          locations={locations}
          onClose={() => setEditing(undefined)}
        />
      )}
      {removal && (
        <RemovalConfirmation
          item={removal}
          noun="item"
          history="Its saved photo is kept during Undo."
          busy={disabled}
          error={api.error}
          schedule={api.remove}
          onClose={() => setRemoving(undefined)}
        />
      )}
    </ContentSurface>
  )
}
