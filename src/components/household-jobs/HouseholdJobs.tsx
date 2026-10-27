import { useRef, useState, type PointerEvent } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { jobsApi } from '../../services/household-jobs-query'
import { executeJobWrite } from '../../features/household-jobs/jobs-actions'
import type { HouseholdJob, JobScope, JobWrite } from '../../features/household-jobs/types'
import { useOnline } from '../../hooks/useOnline'
import { useRemovals } from '../../features/removals/useRemovals'
import { ContentSurface } from '../ui/ContentSurface'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
import { RemovalNotice } from '../removals/RemovalNotice'
import { JobComposer } from './JobComposer'
import './HouseholdJobs.css'
const londonDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
const dateLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value + 'T12:00:00Z'))
    : 'Flexible'
export default function HouseholdJobs() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const owner = user?.id ?? 0
  const online = useOnline()
  const { busy, error, feedback, orderNeedsRefresh } = useAppSelector((s) => s.jobsUi)
  const query = jobsApi.useGetJobsQuery(owner, {
    skip: !owner,
    refetchOnMountOrArgChange: true,
    pollingInterval: busy || !online ? 0 : 15000,
    refetchOnFocus: !busy,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  })
  const { remove, removals } = useRemovals('householdJobs')
  const [scope, setScope] = useState<JobScope>('family')
  const [editing, setEditing] = useState<HouseholdJob | 'new' | null>(null)
  const [details, setDetails] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<HouseholdJob | null>(null)
  const [preview, setPreview] = useState<string[] | null>(null)
  const [orderMessage, setOrderMessage] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; pointerId: number; initial: string[]; ids: string[] } | null>(
    null,
  )
  const retry = useRef<{ signature: string; key: string } | null>(null)
  const data = query.currentData
  const jobs = data?.jobs ?? []
  const archive = data?.archive ?? []
  const scoped = jobs.filter((j) => j.scope === scope)
  const open = scoped.filter((j) => !j.done)
  const all = [...scoped, ...archive.filter((j) => j.scope === scope)]
  const ordered = preview
    ? preview.map((id) => open.find((j) => j.id === id)).filter((j): j is HouseholdJob => !!j)
    : open
  const pending = busy || query.isLoading || !online
  const movePending = pending || orderNeedsRefresh[scope]
  const canManage = (job: HouseholdJob) => job.ownerId === owner || user?.role === 'admin'
  const canFinish = (job: HouseholdJob) => canManage(job) || job.assigneeId === owner
  const person = (id: number | null) =>
    data?.members.find((m) => m.id === id)?.name ?? (id ? 'Family member' : 'Unassigned')
  const detail = all.find((j) => j.id === details)
  const selectedRemoval = jobs.find((j) => j.id === deleting?.id)
  async function save(write: JobWrite) {
    return dispatch(executeJobWrite(write))
  }
  async function act(action: JobWrite['action'], job: HouseholdJob) {
    const body = { id: job.id, version: job.version }
    const signature = action + JSON.stringify(body)
    if (retry.current?.signature !== signature)
      retry.current = { signature, key: crypto.randomUUID() }
    return save({ action, body: { ...body, requestKey: retry.current.key } })
  }
  async function persist(ids: string[], initial: string[]) {
    if (movePending) {
      setPreview(null)
      setOrderMessage('Move cancelled. The saved order is shown.')
      return
    }
    if (ids.join() === initial.join()) {
      setPreview(null)
      setOrderMessage('Order unchanged.')
      return
    }
    setPreview(ids)
    setOrderMessage('Saving order…')
    const success = await save({
      action: 'reorder',
      body: { scope, ids, requestKey: crypto.randomUUID() },
    })
    setPreview(null)
    setOrderMessage(success ? 'Order saved.' : '')
  }
  function move(id: string, delta: number) {
    if (movePending) return
    const ids = open.map((j) => j.id)
    const from = ids.indexOf(id),
      to = from + delta
    if (to < 0 || to >= ids.length) return
    const next = [...ids]
    next.splice(to, 0, next.splice(from, 1)[0])
    void persist(next, ids)
  }
  function startDrag(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (movePending || removals[id] || drag.current || !listRef.current || e.button !== 0) return
    const ids = open.map((j) => j.id)
    drag.current = { id, pointerId: e.pointerId, initial: ids, ids }
    // The card moves during preview; its stable list retains capture across DOM moves.
    listRef.current.setPointerCapture(e.pointerId)
    setOrderMessage('Moving job. Release to save; Escape to cancel.')
  }
  function dragMove(e: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== e.pointerId) return
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>('[data-job]')?.dataset.job
    if (!target || target === current.id) return
    const from = current.ids.indexOf(current.id),
      to = current.ids.indexOf(target)
    if (to < 0) return
    const next = [...current.ids]
    next.splice(to, 0, next.splice(from, 1)[0])
    current.ids = next
    setPreview(next)
  }
  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== e.pointerId) return
    drag.current = null
    void persist(current.ids, current.initial)
  }
  function cancelDrag(pointerId?: number) {
    const current = drag.current
    if (!current || (pointerId !== undefined && pointerId !== current.pointerId)) return
    drag.current = null
    if (listRef.current?.hasPointerCapture(current.pointerId))
      listRef.current.releasePointerCapture(current.pointerId)
    setPreview(null)
    setOrderMessage('Move cancelled.')
  }
  const today = londonDay(new Date())
  const weekStart = new Date(today + 'T12:00:00Z')
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7))
  const since = londonDay(weekStart)
  const completions = all.reduce((total, job) => {
    const retained: typeof job.history = []
    for (const event of [...job.history].reverse()) {
      if (event.action === 'complete') retained.push(event)
      else if (event.action === 'reopen') retained.pop()
    }
    return total + retained.filter((h) => londonDay(new Date(h.occurredAt)) >= since).length
  }, 0)
  return (
    <div className="household-jobs">
      <div className="jobs-heading">
        <div>
          <h2>Household Jobs</h2>
          <p className="note">A little care for the place we share.</p>
        </div>
        <div className="jobs-scope" role="group" aria-label="Jobs scope">
          {(['family', 'mine'] as const).map((s) => (
            <button
              key={s}
              className="secondary"
              aria-pressed={scope === s}
              disabled={busy || !!drag.current}
              onClick={() => {
                setScope(s)
                setOrderMessage('')
              }}
            >
              {s === 'family' ? 'Family' : 'Mine'}
            </button>
          ))}
        </div>
      </div>
      <div className="jobs-metrics" aria-label="Job summary">
        <div>
          <strong>{data ? open.length : '—'}</strong>
          <span>Open jobs</span>
        </div>
        <div>
          <strong>{data ? open.filter((j) => j.targetDate === today).length : '—'}</strong>
          <span>Planned today</span>
        </div>
        <div>
          <strong>{data ? Math.max(0, completions) : '—'}</strong>
          <span>Done this week</span>
        </div>
      </div>
      <ContentSurface>
        <div className="jobs-heading">
          <div>
            <h3>{scope === 'family' ? 'Family jobs' : 'My private jobs'}</h3>
            <p className="note">
              Target days are a guide.{' '}
              {scope === 'family'
                ? 'Moves change the order for everyone.'
                : 'Only you can see these jobs.'}
            </p>
          </div>
          <button disabled={pending || !data} onClick={() => setEditing('new')}>
            <Icon icon={Plus} />
            Add job
          </button>
        </div>
        <p className="note">
          Drag a grip to reorder, or focus it and use ↑ / ↓. You can also use the Move up / Move
          down buttons in job details.
        </p>
        <div role="status" className="note">
          {orderNeedsRefresh[scope]
            ? 'Order was not confirmed. The previous order is shown. Refresh jobs before moving again.'
            : orderMessage || feedback || (query.isFetching ? 'Refreshing jobs…' : '')}
        </div>
        {(error || query.error || orderNeedsRefresh[scope]) && (
          <p className="error" role="alert">
            {'message' in (query.error ?? {})
              ? String((query.error as { message: string }).message)
              : error ||
                (orderNeedsRefresh[scope]
                  ? 'Refresh the saved order to continue moving jobs.'
                  : 'Jobs could not be loaded.')}{' '}
            <button className="secondary" disabled={busy} onClick={() => void query.refetch()}>
              Refresh jobs
            </button>
          </p>
        )}
        {query.isLoading && <p role="status">Loading jobs…</p>}
        {!online && (
          <p role="alert" className="error">
            You are offline. Reconnect before changing jobs.
          </p>
        )}
        {data && (
          <>
            <div
              ref={listRef}
              onPointerMove={dragMove}
              onPointerUp={endDrag}
              onPointerCancel={(e) => cancelDrag(e.pointerId)}
              onLostPointerCapture={(e) => cancelDrag(e.pointerId)}
              className="jobs-list"
              role="list"
              aria-label={scope === 'family' ? 'Shared household jobs' : 'Private household jobs'}
            >
              {ordered.map((job, index) => (
                <article
                  key={job.id}
                  data-job={job.id}
                  className="job-card"
                  role="listitem"
                  aria-posinset={index + 1}
                  aria-setsize={ordered.length}
                >
                  <button
                    className="job-grip secondary"
                    aria-label={'Move ' + job.title}
                    aria-describedby="jobs-move-help"
                    disabled={movePending || !!removals[job.id]}
                    onPointerDown={(e) => startDrag(e, job.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        cancelDrag()
                        return
                      }
                      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.repeat) {
                        e.preventDefault()
                        if (!movePending) move(job.id, e.key === 'ArrowUp' ? -1 : 1)
                      }
                    }}
                  >
                    <Icon icon={GripVertical} />
                  </button>
                  <div className="job-card__body">
                    <button className="job-title" onClick={() => setDetails(job.id)}>
                      {job.title}
                    </button>
                    <p className="job-meta">
                      {job.area && <span>{job.area}</span>}
                      <span>
                        {job.targetDate ? 'Target ' + dateLabel(job.targetDate) : 'Flexible'}
                      </span>
                      {job.repeat !== 'none' && (
                        <span>{job.repeat === 'weekly' ? 'Weekly' : 'Monthly'}</span>
                      )}
                    </p>
                    <p className="note">
                      {job.assigneeId ? 'With ' + person(job.assigneeId) : 'Anyone can claim'}
                    </p>
                    <RemovalNotice removal={removals[job.id]} />
                  </div>
                  <div className="job-card__actions">
                    {job.assigneeId === null && (
                      <button
                        className="secondary"
                        disabled={pending || !!removals[job.id]}
                        onClick={() => void act('claim', job)}
                      >
                        Claim
                      </button>
                    )}
                    {canFinish(job) && (
                      <button
                        disabled={pending || !!removals[job.id]}
                        onClick={() => void act('complete', job)}
                      >
                        Done
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <p id="jobs-move-help" className="note">
              {open.length
                ? 'Open a job for notes, assignment, history and more actions.'
                : 'No open jobs. Add a job whenever you need one.'}
            </p>
            {(scoped.some((j) => j.done) || archive.some((j) => j.scope === scope)) && (
              <details className="jobs-history">
                <summary>Completed &amp; removed jobs</summary>
                {all
                  .filter((j) => j.done || archive.some((a) => a.id === j.id))
                  .map((job) => (
                    <button key={job.id} className="secondary" onClick={() => setDetails(job.id)}>
                      {job.title} · {job.done ? 'Done' : 'Removed'}
                    </button>
                  ))}
              </details>
            )}
          </>
        )}
      </ContentSurface>
      {editing && (
        <JobComposer
          job={editing === 'new' ? undefined : editing}
          scope={scope}
          members={data?.members ?? []}
          busy={busy}
          error={error}
          latest={editing === 'new' ? undefined : jobs.find((j) => j.id === editing.id)}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetails(null)} busy={busy} scrollable>
          <p className="note">
            {detail.scope === 'mine' ? 'Private · Only you' : 'Shared with family'} ·{' '}
            {detail.area || 'No area'} · {dateLabel(detail.targetDate)}
          </p>
          {detail.note && <p className="job-note">{detail.note}</p>}
          <p>
            Assigned to: {person(detail.assigneeId)} ·{' '}
            {detail.repeat === 'none' ? 'Does not repeat' : detail.repeat}
          </p>
          {!archive.some((j) => j.id === detail.id) && (
            <div className="actions">
              {canManage(detail) && (
                <>
                  <button
                    className="secondary"
                    disabled={pending || !!removals[detail.id]}
                    onClick={() => {
                      setDetails(null)
                      setEditing(detail)
                    }}
                  >
                    Edit / assign
                  </button>
                  <button
                    className="secondary"
                    disabled={pending || !!removals[detail.id]}
                    onClick={() => {
                      setDetails(null)
                      setDeleting(detail)
                    }}
                  >
                    Remove job
                  </button>
                </>
              )}
              {canFinish(detail) &&
                detail.history.find((h) => h.action === 'complete' || h.action === 'reopen')
                  ?.action === 'complete' && (
                  <button
                    disabled={pending || !!removals[detail.id]}
                    onClick={() => void act('reopen', detail)}
                  >
                    Reopen last completion
                  </button>
                )}
              {!detail.done && (
                <>
                  <button
                    className="secondary"
                    disabled={movePending || open[0]?.id === detail.id || !!removals[detail.id]}
                    onClick={() => move(detail.id, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="secondary"
                    disabled={movePending || open.at(-1)?.id === detail.id || !!removals[detail.id]}
                    onClick={() => move(detail.id, 1)}
                  >
                    Move down
                  </button>
                </>
              )}
            </div>
          )}
          <h3>Activity &amp; occurrences</h3>
          <ol className="jobs-activity">
            {detail.history.map((h) => (
              <li key={h.id}>
                <strong>{h.actor.name}</strong> ·{' '}
                {{
                  add: 'created',
                  edit: 'edited',
                  claim: 'claimed',
                  assign: 'assigned',
                  complete: 'completed',
                  reopen: 'reopened',
                  remove: 'removed',
                }[h.action] ?? h.action}{' '}
                {h.action === 'complete' && '· ' + dateLabel(h.targetDate)}
                <time dateTime={h.occurredAt}>
                  {new Date(h.occurredAt).toLocaleString('en-GB')}
                </time>
              </li>
            ))}
          </ol>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </Modal>
      )}
      {selectedRemoval && (
        <RemovalConfirmation
          item={selectedRemoval}
          noun="job"
          history="Future repeats stop. Its occurrence history is kept."
          busy={busy}
          error={error}
          schedule={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
