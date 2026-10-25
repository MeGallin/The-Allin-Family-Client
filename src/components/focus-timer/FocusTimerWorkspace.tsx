import { useEffect, useRef, useState } from 'react'
import { CircleHelp, Play, Pause, LockKeyhole, Coffee } from 'lucide-react'
import { useFocusTimer } from '../../features/focus-timer/useFocusTimer'
import {
  focusPhases,
  type FocusPhase,
  type FocusSnapshot,
  type FocusWrite,
} from '../../features/focus-timer/types'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { ContentSurface } from '../ui/ContentSurface'
import { LoadingState } from '../ui/LoadingState'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
import { RemovalNotice } from '../removals/RemovalNotice'
import { FocusHourglass } from './FocusHourglass'
import './FocusTimer.css'
export default function FocusTimerWorkspace({ onInstall }: { onInstall: () => void }) {
  const timer = useFocusTimer()
  if (!timer.data)
    return timer.loading ? (
      <LoadingState label="Opening your personal timer…" />
    ) : (
      <ContentSurface>
        <h2>Focus Timer is unavailable</h2>
        <p role="alert" className="error">
          {timer.error}
        </p>
        <button type="button" onClick={timer.refresh} disabled={timer.offline}>
          Try again
        </button>
      </ContentSurface>
    )
  return <FocusDesk initial={timer.data} timer={timer} onInstall={onInstall} />
}
function FocusDesk({
  initial,
  timer,
  onInstall,
}: {
  initial: FocusSnapshot
  timer: ReturnType<typeof useFocusTimer>
  onInstall: () => void
}) {
  const [base, setBase] = useState(initial),
    [phase, setPhase] = useState<FocusPhase>('focus'),
    [minutes, setMinutes] = useState(String(initial.defaults.focus)),
    [label, setLabel] = useState('')
  const [message, setMessage] = useState(''),
    [unresolved, setUnresolved] = useState(false),
    [help, setHelp] = useState(false),
    [confirm, setConfirm] = useState<'finish' | 'reset' | 'remove' | null>(null)
  const [ackVersion, setAckVersion] = useState<number | null>(null)
  const request = useRef<FocusWrite | null>(null),
    [tick, setTick] = useState(() => performance.now())
  const anchor = useRef({ at: performance.now(), elapsed: initial.session?.elapsedMs ?? 0 })
  const session = base.session,
    latest = timer.data,
    removal = timer.removals['focus-timer']
  const dirty =
    !session && (phase !== 'focus' || minutes !== String(base.defaults.focus) || !!label)
  const guard = useDraftGuard(dirty || !!request.current, timer.pending)
  const stale = !!latest && latest.version !== base.version
  const awaitingSync = ackVersion !== null && (!latest || latest.version < ackVersion)
  const locked = timer.pending || timer.offline || !!removal || stale || unresolved || awaitingSync
  const duration = Number(minutes),
    valid =
      Number.isInteger(duration) &&
      duration >= (phase === 'focus' ? 5 : 1) &&
      duration <= (phase === 'focus' ? 180 : 60) &&
      label.length <= 80
  function adopt(value: FocusSnapshot) {
    setBase(value)
    anchor.current = { at: performance.now(), elapsed: value.session?.elapsedMs ?? 0 }
    setTick(performance.now())
  }
  useEffect(() => {
    if (
      latest &&
      (ackVersion === null || latest.version >= ackVersion) &&
      (!dirty || (ackVersion !== null && latest.version >= ackVersion)) &&
      !timer.pending &&
      !request.current
    ) {
      adopt(latest)
      setAckVersion(null)
    }
  }, [latest, dirty, timer.pending, unresolved, ackVersion])
  // Only this visible workspace repaints seconds; server timestamps remain authoritative.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    const visible = () => {
      if (interval) clearInterval(interval)
      setTick(performance.now())
      if (!document.hidden && session?.state === 'running')
        interval = setInterval(() => setTick(performance.now()), 1000)
    }
    visible()
    document.addEventListener('visibilitychange', visible)
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [session?.id, session?.state])
  const elapsed = session
    ? Math.min(
        session.durationMs,
        anchor.current.elapsed +
          (session.state === 'running' ? Math.max(0, tick - anchor.current.at) : 0),
      )
    : 0
  const reached = !!session && (session.state === 'elapsed' || elapsed >= session.durationMs)
  const remaining = session ? Math.max(0, session.durationMs - elapsed) : duration * 60000
  const seconds = Number.isFinite(remaining) ? Math.ceil(remaining / 1000) : 0,
    time =
      !session && !valid
        ? '--:--'
        : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  useEffect(() => {
    if (reached)
      setMessage('Your timer reached its planned duration. Choose the next step when you’re ready.')
  }, [reached, session?.id])
  function change(action: () => void) {
    if (locked || session || !base.installed) return
    request.current = null
    timer.clearError()
    setMessage('')
    action()
  }
  async function perform(action: FocusWrite['action'], extra: object = {}, retry = false) {
    if (timer.pending || timer.offline || removal) return
    if (!retry)
      request.current = {
        action,
        body: {
          version: base.version,
          generation: base.generation,
          sessionId: session?.id ?? null,
          ...extra,
          requestKey: crypto.randomUUID(),
        },
      }
    const pending = request.current
    if (!pending) return
    setUnresolved(true)
    setConfirm(null)
    const result = await timer.write(pending.action, pending.body)
    if (result?.failure && result.failure.status > 0 && result.failure.status < 500)
      setUnresolved(false)
    if (result?.receipt) {
      setAckVersion(result.receipt.version)
      request.current = null
      setUnresolved(false)
      setLabel('')
      setPhase('focus')
      setMinutes(String(result.receipt.defaults.focus))
      setMessage(
        pending.action === 'pause'
          ? result.receipt.session?.state === 'elapsed'
            ? 'Your timer reached its planned duration. Choose the next step when you’re ready.'
            : 'Your timer is paused.'
          : pending.action === 'resume'
            ? 'Your timer resumed.'
            : pending.action === 'finish'
              ? 'Session finished. Your timed minutes are saved.'
              : pending.action === 'reset'
                ? 'Session reset. Its history is kept.'
                : 'Your timer is saved.',
      )
    }
  }
  function loadLatest() {
    if (!latest || unresolved) return
    guard.close(() => {
      request.current = null
      setLabel('')
      setPhase('focus')
      setMinutes(String(latest.defaults.focus))
      timer.clearError()
      adopt(latest)
      setMessage('Latest timer loaded.')
    })
  }
  const displayedPhase = session?.phase ?? phase,
    phaseLabel = focusPhases.find((p) => p.id === displayedPhase)!.label
  return (
    <ContentSurface className="focus-timer">
      <header className="ft-heading">
        <div>
          <h2>Focus Timer</h2>
          <p>A little time for one thing.</p>
        </div>
        <button
          type="button"
          className="secondary"
          aria-label="How the timer works"
          onClick={() => setHelp(true)}
        >
          <Icon icon={CircleHelp} />
        </button>
      </header>
      {!base.installed && (
        <p className="ft-notice">
          Your personal timer is ready to install. Your sessions and history will stay private.
        </p>
      )}
      {awaitingSync && (
        <p className="ft-notice" role="status">
          Your action is saved. Refresh to load the current timer before continuing.
        </p>
      )}
      <RemovalNotice removal={removal} />
      {stale && (
        <div role="status" className="ft-notice">
          <p>Your timer changed in another window. Your unaccepted setup is kept.</p>
          <button type="button" disabled={timer.pending || unresolved} onClick={loadLatest}>
            Load latest timer
          </button>
        </div>
      )}
      <div className="ft-layout">
        <section className="ft-play" aria-label="Your personal timer">
          <div className="ft-modes" role="group" aria-label="Timer phase">
            {focusPhases.map((p) => (
              <button
                type="button"
                className="secondary"
                key={p.id}
                aria-pressed={displayedPhase === p.id}
                disabled={locked || !!session || !base.installed}
                onClick={() =>
                  change(() => {
                    setPhase(p.id)
                    setMinutes(String(base.defaults[p.id]))
                  })
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="ft-clock">
            <FocusHourglass
              anchor={anchor.current}
              durationMs={session?.durationMs ?? 0}
              running={session?.state === 'running'}
              resting={!session || session.state === 'paused'}
            />
            <span className="note">
              {phaseLabel} ·{' '}
              {session ? session.durationMs / 60000 : Number.isFinite(duration) ? duration : '—'}{' '}
              {(session ? session.durationMs / 60000 : duration) === 1 ? 'minute' : 'minutes'}
            </span>
            <strong
              className="ft-time"
              role="timer"
              aria-live="off"
              aria-label={`${time} remaining`}
            >
              {time}
            </strong>
            <span>
              {timer.offline
                ? 'Offline estimate'
                : !session
                  ? 'Ready when you are'
                  : reached
                    ? 'Time’s up'
                    : session.state === 'paused'
                      ? 'Paused'
                      : 'Running'}
            </span>
          </div>
          {session?.label && <p className="ft-session-label">{session.label}</p>}
          <div className="ft-actions">
            {!base.installed ? (
              <button
                type="button"
                disabled={timer.pending || timer.offline || !!removal}
                onClick={onInstall}
              >
                Install personal Focus Timer
              </button>
            ) : !session ? (
              <button
                type="button"
                disabled={locked || !valid}
                onClick={() => void perform('start', { phase, minutes: duration, label })}
              >
                <Icon icon={Play} />
                Start {phase === 'focus' ? 'focus' : 'break'}
              </button>
            ) : reached ? (
              <>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    void perform('next', {
                      phase: session.phase === 'focus' ? 'short' : 'focus',
                      minutes: session.phase === 'focus' ? 5 : 25,
                      label: '',
                    })
                  }
                >
                  <Icon icon={Coffee} />
                  {session.phase === 'focus' ? 'Start 5-minute break' : 'Start 25-minute focus'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={locked}
                  onClick={() => void perform('finish')}
                >
                  Done for now
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => void perform(session.state === 'paused' ? 'resume' : 'pause')}
                >
                  <Icon icon={session.state === 'paused' ? Play : Pause} />
                  {session.state === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={locked}
                  onClick={() => setConfirm('finish')}
                >
                  Finish session
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={locked}
                  onClick={() => setConfirm('reset')}
                >
                  Reset
                </button>
              </>
            )}
          </div>
          <p className="note">
            {session
              ? 'Elapsed timer time is measured, not attention. Nothing starts automatically.'
              : 'Choose one session. Start a break only when you want one.'}
          </p>
          <p role="status" aria-live="polite">
            {timer.pending ? 'Saving your timer…' : message}
          </p>
          {timer.error && (
            <p role="alert" className="error">
              {timer.error}
            </p>
          )}
          {request.current && !timer.pending && (timer.failure || unresolved) && (
            <div className="ft-notice">
              <p>
                {unresolved
                  ? 'The response was not confirmed. Retry the same action to resolve whether it saved.'
                  : 'Your setup is kept. Review the latest timer before trying again.'}
              </p>
              <div className="actions">
                <button
                  type="button"
                  disabled={timer.offline || !!removal}
                  onClick={() => void perform(request.current!.action, {}, true)}
                >
                  Retry same action
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={timer.offline}
                  onClick={timer.refresh}
                >
                  Refresh status
                </button>
                {!unresolved && (
                  <button type="button" className="secondary" onClick={loadLatest}>
                    Load latest timer
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
        <aside className="ft-rail">
          <section>
            <h3>Your session</h3>
            <label>
              Session label <small>Optional · private to you</small>
              <input
                value={session?.label ?? label}
                maxLength={80}
                disabled={locked || !!session || !base.installed}
                onChange={(e) => change(() => setLabel(e.target.value))}
                placeholder="What would you like time for?"
              />
            </label>
            <span className="note">Choose a duration</span>
            <div className="ft-presets">
              {(displayedPhase === 'focus' ? [15, 25, 50] : [5, 15]).map((n) => (
                <button
                  type="button"
                  className="secondary"
                  key={n}
                  disabled={locked || !!session || !base.installed}
                  aria-pressed={(session ? session.durationMs / 60000 : Number(minutes)) === n}
                  onClick={() => change(() => setMinutes(String(n)))}
                >
                  {n} min
                </button>
              ))}
            </div>
            <label>
              Custom minutes
              <input
                type="number"
                min={phase === 'focus' ? 5 : 1}
                max={phase === 'focus' ? 180 : 60}
                step="1"
                value={session ? String(session.durationMs / 60000) : minutes}
                disabled={locked || !!session || !base.installed}
                onChange={(e) => change(() => setMinutes(e.target.value))}
              />
            </label>
            <p className="note">
              Focus 5–180 minutes · breaks 1–60.{' '}
              {session ? 'Finish or reset before changing setup.' : ''}
            </p>
          </section>
          <section>
            <h3>A pause, when you choose.</h3>
            <p>
              Short break · 5 minutes
              <br />
              Long break · 15 minutes
            </p>
            <p>Nothing starts automatically after this timer.</p>
          </section>
          <details>
            <summary>Your last seven days</summary>
            <ol
              className="ft-week"
              aria-label="Timed focus minutes for each of the last seven days"
            >
              {(base.days ?? []).map((day) => (
                <li key={day.date}>
                  <time dateTime={day.date} title={day.date}>
                    {new Date(day.date + 'T12:00:00Z').toLocaleDateString('en-GB', {
                      weekday: 'short',
                      timeZone: 'Europe/London',
                    })}
                  </time>
                  <strong>{day.focusMs ? Math.floor(day.focusMs / 60000) : '—'}</strong>
                  <span className="sr-only">timed focus minutes, {day.date}</span>
                </li>
              ))}
            </ol>
            <div className="ft-totals">
              <span>
                <strong>{base.summary.focusCompleted}</strong>Full focus sessions
              </span>
              <span>
                <strong>{Math.floor(base.summary.focusMs / 60000)}</strong>Timed focus minutes
              </span>
              <span>
                <strong>{Math.floor(base.summary.breakMs / 60000)}</strong>Timed break minutes
              </span>
            </div>
            <p className="note">
              Your last seven days. Early finishes add timed minutes, but don’t count as full
              sessions.
            </p>
            {base.history.length ? (
              <ul className="ft-history">
                {base.history.map((s) => (
                  <li key={s.id}>
                    <strong>{s.label || focusPhases.find((p) => p.id === s.phase)?.label}</strong>
                    <small>
                      {s.endedAt
                        ? new Date(s.endedAt).toLocaleDateString('en-GB', {
                            timeZone: 'Europe/London',
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}{' '}
                      ·{' '}
                      {s.state === 'completed'
                        ? 'Finished'
                        : s.state === 'early'
                          ? 'Ended early'
                          : s.state === 'elapsed_removed'
                            ? 'Elapsed · removed'
                            : 'Discarded'}{' '}
                      ·{' '}
                      {s.elapsedMs > 0 && s.elapsedMs < 60000
                        ? '<1'
                        : Math.floor(s.elapsedMs / 60000)}{' '}
                      timed min
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="note">No recent sessions yet.</p>
            )}
          </details>
          <p className="ft-private">
            <Icon icon={LockKeyhole} />
            Your labels and sessions stay personal.
          </p>
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={timer.pending || timer.offline}
              onClick={timer.refresh}
            >
              Refresh
            </button>
            {base.installed && (
              <button
                type="button"
                className="secondary"
                disabled={timer.pending || !!removal || unresolved || stale}
                onClick={() => guard.close(() => setConfirm('remove'))}
              >
                Remove Focus Timer
              </button>
            )}
          </div>
        </aside>
      </div>
      {help && (
        <Modal title="How the timer works" onClose={() => setHelp(false)}>
          <p>
            Choose Focus, Short break or Long break and start it yourself. Pause freezes remaining
            time; Resume continues the same session.
          </p>
          <p>
            Your saved timer continues through navigation, hiding the tab or signing out. Return
            online to reconcile with server time. It measures elapsed time, not your attention.
          </p>
          <p>
            At time reached, choose the next phase or Done for now. Breaks never start
            automatically. This timer stays quiet and cannot promise an alarm while your device
            sleeps or browser is closed.
          </p>
          <p>
            Early Finish records actual timer time separately from full finishes. Reset discards the
            current session. Your private seven-day history is retained.
          </p>
        </Modal>
      )}
      {(confirm === 'finish' || confirm === 'reset') && (
        <Modal
          title={confirm === 'finish' ? 'Finish this session early?' : 'Reset this session?'}
          busy={timer.pending}
          onClose={() => setConfirm(null)}
        >
          <p>
            {confirm === 'finish'
              ? 'Only elapsed running time will be recorded. This is not a full-duration finish.'
              : 'The current timer will stop and be recorded as discarded. It won’t count as a finished session.'}
          </p>
          <div className="actions">
            <button type="button" onClick={() => void perform(confirm)}>
              {confirm === 'finish' ? 'Finish session' : 'Reset session'}
            </button>
            <button type="button" className="secondary" onClick={() => setConfirm(null)}>
              Keep timer
            </button>
          </div>
        </Modal>
      )}
      {confirm === 'remove' && (
        <RemovalConfirmation
          item={{ id: 'focus-timer', title: 'Focus Timer', version: base.version }}
          noun="Focus Timer installation"
          history="The current timer continues during Undo, then stops when removal completes. Private history is kept; reinstall will not resume it."
          busy={timer.pending}
          error={timer.error}
          schedule={timer.remove}
          onClose={() => setConfirm(null)}
        />
      )}
    </ContentSurface>
  )
}
