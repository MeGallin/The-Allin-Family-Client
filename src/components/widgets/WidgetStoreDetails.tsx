import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  widgetInstallationPath,
  type WidgetStoreApp,
} from '../../features/widgets/widget-catalogue'
import type { FamilyWidget } from '../../features/widgets/types'
import { Modal } from '../ui/Modal'
import { HorizontalScroll } from '../ui/HorizontalScroll'
import { WidgetAppIcon, WidgetPreviewArt } from './WidgetStoreArt'

export function WidgetStoreDetails({
  app,
  installations,
  ready,
  loading,
  action,
  onClose,
  onInstall,
  visibility,
  availability,
}: {
  app: WidgetStoreApp
  installations: FamilyWidget[]
  ready: boolean
  loading: boolean
  action: ReactNode
  onClose: () => void
  onInstall: () => void
  visibility?: string
  availability?: string
}) {
  return (
    <Modal
      title="Widget Store"
      className="widget-store widget-store-detail"
      scrollable
      onClose={onClose}
    >
      <header className="detail-identity">
        <WidgetAppIcon id={app.id} />
        <div>
          <h3>{app.title}</h3>
          <p>{app.subtitle}</p>
          {action}
        </div>
      </header>
      <div className="detail-facts">
        <span>
          Category
          <strong>
            {app.category === 'family' ? 'Family' : app.category === 'games' ? 'Games' : 'Tools'}
          </strong>
        </span>
        <span>
          Visibility
          <strong>
            {visibility ??
              (app.availability === 'proposed'
                ? 'Proposed'
                : app.id === 'dinner'
                  ? 'Personal or family'
                  : 'Shared family')}
          </strong>
        </span>
        <span>
          Availability
          <strong>
            {availability ??
              (app.availability === 'proposed'
                ? 'Proposed'
                : app.id === 'dinner'
                  ? ready
                    ? installations.length
                      ? 'Installed'
                      : 'Available'
                    : loading
                      ? 'Checking status'
                      : 'Status unavailable'
                  : 'Installed')}
          </strong>
        </span>
      </div>
      {app.availability === 'proposed' && (
        <p className="detail-proposed">
          Proposed app — not available to install or use. These covers illustrate an idea.
        </p>
      )}
      <HorizontalScroll className="store-gallery" label={app.title + ' illustrative previews'}>
        <div className="detail-gallery">
          {app.previews.map((copy, index) => (
            <div className="preview-cover" key={copy}>
              <div>
                <small>
                  Illustrative {app.availability === 'proposed' ? 'concept' : 'preview'}
                </small>
                <strong>{copy}</strong>
              </div>
              <WidgetPreviewArt id={app.id} />
              <p>
                {index === 0
                  ? app.subtitle
                  : app.id === 'dinner'
                    ? 'Private ideas. Shared dinner choices.'
                    : app.availability === 'installed'
                      ? 'One shared family tool.'
                      : app.availability === 'proposed'
                        ? 'A future idea — not yet available.'
                        : 'Your personal game, saved for you.'}
              </p>
            </div>
          ))}
        </div>
      </HorizontalScroll>
      <div className="detail-description">
        <h3>About this app</h3>
        <p>{app.description}</p>
        <p>Preview artwork is illustrative and does not show family content.</p>
      </div>
      {app.id === 'dinner' && (
        <>
          {installations.length > 0 && (
            <section className="store-installations">
              <h3>Your available installations</h3>
              <ul>
                {installations.map((widget) => (
                  <li key={widget.id}>
                    <Link to={widgetInstallationPath(widget)} onClick={onClose}>
                      {widget.title}
                    </Link>
                    <span>
                      {widget.visibility === 'private' ? 'Personal' : 'Family'}
                      {widget.hidden ? ' · Hidden from your shelf' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <button type="button" className="secondary" onClick={onInstall} disabled={!ready}>
            {installations.length ? 'Install another Dinner Spinner' : 'Install Dinner Spinner'}
          </button>
        </>
      )}
    </Modal>
  )
}
