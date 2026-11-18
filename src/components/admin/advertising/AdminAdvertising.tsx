import { useEffect, useState } from 'react'
import { useDraftGuard } from '../../../features/drafts/DraftProtection'
import { useAppSelector } from '../../../app/store-hooks'
import type { AdvertAdmin, AdvertConfig } from '../../../features/advertising/types'
import {
  getAdvertAdmin,
  getAdvertCredentials,
  mutateAdvertising,
} from '../../../services/advertising-api'
import { apiUrl } from '../../../services/api-client'
import { LoadingState } from '../../ui/LoadingState'
import { AdvertCard } from '../../advertising/AdvertCard'
import { CopySettings } from './CopySettings'
import { ScheduleSettings } from './ScheduleSettings'
import { ModelSettings } from './ModelSettings'
import { ImageSettings } from './ImageSettings'
import { BudgetSettings } from './BudgetSettings'
import { CatalogueSettings } from './CatalogueSettings'
import type { EditAdvert } from './Fields'
import './AdminAdvertising.css'

const timestamp = (value: number | null) =>
  value ? new Date(value * 1000).toLocaleString() : 'Not scheduled'
export default function AdminAdvertising() {
  const user = useAppSelector((s) => s.auth.user)
  const [snapshot, setSnapshot] = useState<AdvertAdmin | null>(null)
  const [draft, setDraft] = useState<AdvertConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [credentials, setCredentials] = useState<{
    providerConfigured: boolean
    engineAvailable: boolean
  } | null>(null)
  const dirty = Boolean(
    draft && snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.draft),
  )
  const guard = useDraftGuard(dirty, busy)
  useEffect(() => {
    if (user?.role !== 'admin') return
    const abort = new AbortController()
    void getAdvertAdmin(abort.signal)
      .then((data) => {
        setSnapshot(data)
        setDraft(structuredClone(data.draft))
      })
      .catch((e: Error) => {
        if (!abort.signal.aborted) setError(e.message)
      })
    return () => abort.abort()
  }, [user?.id, user?.role])
  if (user?.role !== 'admin') return null
  const edit: EditAdvert = (change) =>
    setDraft((value) => {
      if (!value) return value
      const copy = structuredClone(value)
      change(copy)
      return copy
    })
  async function reload() {
    setBusy(true)
    setError('')
    try {
      const data = await getAdvertAdmin()
      setSnapshot(data)
      setDraft(structuredClone(data.draft))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reload advertising.')
    } finally {
      setBusy(false)
    }
  }
  async function action(name: string) {
    if (!snapshot || !draft || busy) return
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      const data = await mutateAdvertising({
        action: name,
        version: snapshot.version,
        draftVersion: snapshot.draftVersion,
        configRevision: snapshot.configRevision,
        candidateId: snapshot.candidate?.id,
        ...(name === 'save-draft'
          ? {
              config: {
                ...draft,
                brand: {
                  ...draft.brand,
                  exclusions: draft.brand.exclusions.filter((line) => line.trim()),
                },
                features: draft.features.map((feature) => ({
                  ...feature,
                  exclusions: feature.exclusions.filter((line) => line.trim()),
                })),
              },
            }
          : {}),
      })
      guard.complete(() => {
        setSnapshot(data)
        setDraft(structuredClone(data.draft))
      })
      setFeedback(
        name === 'save-draft'
          ? 'Configuration draft saved. Apply it when ready; publication is separate.'
          : name === 'apply'
            ? 'Saved settings applied. Existing candidates were invalidated.'
            : 'Advertising action completed. Review the current status below.',
      )
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : 'Unable to update advertising.') +
          ' Your local draft is preserved. Reload to check an uncertain result before retrying.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function checkCredentials() {
    setBusy(true)
    setError('')
    try {
      setCredentials((await getAdvertCredentials()).credentials)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to check engine status.')
    } finally {
      setBusy(false)
    }
  }
  if (!snapshot || !draft)
    return (
      <section className="content-surface">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button type="button" onClick={() => void reload()}>
              Try again
            </button>
          </>
        ) : (
          <LoadingState label="Opening advertising…" />
        )}
      </section>
    )
  return (
    <section className="advert-settings" aria-labelledby="advertising-heading">
      <header>
        <h2 id="advertising-heading">Feature advertising</h2>
        <p>
          One shared spotlight. Approved feature facts only. Your existing administrator account
          controls preparation and publication.
        </p>
      </header>
      {error && <p role="alert">{error}</p>}
      {feedback && <p role="status">{feedback}</p>}
      <section aria-label="Advertising overview">
        <h3>Overview</h3>
        <dl className="advert-settings__overview">
          <div>
            <dt>Service</dt>
            <dd>
              {snapshot.config.enabled
                ? snapshot.config.paused
                  ? 'Paused'
                  : 'Enabled'
                : 'Disabled'}
            </dd>
          </div>
          <div>
            <dt>Last outcome</dt>
            <dd>{snapshot.lastOutcome.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt>Configuration</dt>
            <dd>
              Applied revision {snapshot.configRevision} · saved draft {snapshot.draftVersion}
            </dd>
          </div>
          <div>
            <dt>Next eligible publication</dt>
            <dd>{timestamp(snapshot.nextEligibleAt)}</dd>
          </div>
          <div>
            <dt>Engine work</dt>
            <dd>{snapshot.working ? 'Preparing under a durable lease' : 'No active job'}</dd>
          </div>
        </dl>
        <p className="note">
          Provider: OpenAI. Signing connection{' '}
          {snapshot.credentials.bridgeConfigured ? 'configured' : 'not configured'}.{' '}
          {credentials &&
            `Engine ${credentials.engineAvailable ? 'available' : 'unavailable'}; provider credential ${credentials.providerConfigured ? 'configured' : 'not configured'}.`}
        </p>
        <div className="actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void checkCredentials()}
          >
            Check engine credentials
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => guard.close(() => void reload())}
          >
            Reload settings
          </button>
          <a href={apiUrl('/admin/advertising/export')} download>
            Export configuration metadata
          </a>
        </div>
        <p className="note">
          Export excludes advert bodies, provider keys and machine grants. Host backups may retain
          earlier private state independently; this is not a forensic erasure guarantee.
        </p>
      </section>
      <section aria-label="Publication controls">
        <h3>Current and successor</h3>
        <div className="advert-settings__previews">
          <div>
            <h4>Current</h4>
            {snapshot.current ? (
              <AdvertCard payload={snapshot.current.payload} image={snapshot.current.image} />
            ) : (
              <p>No advert is published.</p>
            )}
          </div>
          <div>
            <h4>
              Candidate{' '}
              {snapshot.candidate
                ? snapshot.candidate.approved
                  ? '· approved'
                  : '· awaiting approval'
                : ''}
            </h4>
            {snapshot.candidate ? (
              <AdvertCard payload={snapshot.candidate.payload} image={snapshot.candidate.image} />
            ) : (
              <p>No candidate is prepared.</p>
            )}
          </div>
        </div>
        <div className="actions">
          {(
            [
              'prepare',
              'approve',
              'reject',
              'publish',
              snapshot.config.paused ? 'resume' : 'pause',
              'disable',
            ] as const
          ).map((name) => (
            <button
              type="button"
              className="secondary"
              key={name}
              disabled={
                busy ||
                dirty ||
                (['approve', 'reject', 'publish'].includes(name) && !snapshot.candidate) ||
                (name === 'prepare' &&
                  (!snapshot.config.enabled ||
                    snapshot.config.paused ||
                    snapshot.working ||
                    Boolean(snapshot.candidate)))
              }
              onClick={() => void action(name)}
            >
              {name === 'prepare'
                ? 'Prepare candidate'
                : name === 'publish'
                  ? 'Publish eligible candidate'
                  : name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
        <p className="note">
          Preparing uses the configured service limits and estimated image reservation. Actual image
          charges can exceed that estimate. Approval and publication are separate. Publication swaps
          the candidate for the current advert and deletes the old body. Current valid copy remains
          visible while its successor is prepared. No archive is kept.
        </p>
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void action('save-draft')
        }}
      >
        <fieldset disabled={busy} className="advert-settings__editor">
          <legend>Configuration draft</legend>
          <CopySettings draft={draft} edit={edit} />
          <ScheduleSettings draft={draft} edit={edit} />
          <ModelSettings draft={draft} edit={edit} models={snapshot.models} />
          <ImageSettings draft={draft} edit={edit} />
          <BudgetSettings draft={draft} edit={edit} />
          <CatalogueSettings draft={draft} edit={edit} />
          <div className="actions">
            <button type="submit" disabled={!dirty || busy}>
              Save configuration draft
            </button>
            <button
              type="button"
              className="secondary"
              disabled={
                dirty || busy || JSON.stringify(snapshot.config) === JSON.stringify(snapshot.draft)
              }
              onClick={() => void action('apply')}
            >
              Apply saved settings
            </button>
          </div>
        </fieldset>
      </form>
      <details>
        <summary>Usage and metadata audit</summary>
        <p className="note">
          Usage includes conservative reservations for unknown outcomes. Currency is an estimate in
          USD; counters use UTC boundaries.
        </p>
        <ul>
          {Object.entries(snapshot.usage).map(([period, usage]) => (
            <li key={period}>
              {period}: ${(usage.micros / 1000000).toFixed(6)} · {usage.calls} calls ·{' '}
              {usage.tokens} text tokens · {usage.images ?? 0} images · {usage.imageTokens ?? 0}{' '}
              image tokens
            </li>
          ))}
        </ul>
        <ol>
          {[...snapshot.audit].reverse().map((entry, i) => (
            <li key={i}>
              {timestamp(entry.at)} · {entry.event.replaceAll('_', ' ')} · revision {entry.revision}{' '}
              · {entry.actorId ? 'administrator #' + entry.actorId : 'service'}
            </li>
          ))}
        </ol>
      </details>
    </section>
  )
}
