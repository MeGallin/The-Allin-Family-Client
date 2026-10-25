import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useDailyWord } from '../../features/daily-word/useDailyWord'
import type { WordMark, WordSnapshot, WordWrite } from '../../features/daily-word/types'
import { WORD_RESULTS_PATH } from '../../features/daily-word/types'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { useNow } from '../../hooks/useNow'
import { ContentSurface } from '../ui/ContentSurface'
import { LoadingState } from '../ui/LoadingState'
import { Modal } from '../ui/Modal'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
import { RemovalNotice } from '../removals/RemovalNotice'
import './DailyWord.css'
const descriptions = {
  correct: 'correct position',
  present: 'in the word, another position',
  absent: 'not in the remaining word',
}
const symbols = { correct: '✓', present: '↔', absent: '·' }
const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
export default function DailyWordWorkspace({ onInstall }: { onInstall: () => void }) {
  const word = useDailyWord()
  const [retained, setRetained] = useState<WordSnapshot | null>(
    word.installed ? (word.data ?? null) : null,
  )
  useEffect(() => {
    if (word.installed && word.data) setRetained(word.data)
  }, [word.installed, word.data])
  if (word.loading) return <LoadingState label="Opening your personal Daily Word…" />
  if (retained) return <DailyWordBoard initial={retained} word={word} onInstall={onInstall} />
  if (!word.installed || !word.data)
    return (
      <ContentSurface>
        <h2>Your personal Daily Word</h2>
        <p>
          Five letters. Six valid guesses. The same daily word for the family, with private
          progress.
        </p>
        {word.error && (
          <p role="alert" className="error">
            {word.error}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            disabled={!word.known || word.pending || word.offline || !!word.removals['daily-word']}
            onClick={onInstall}
          >
            Install personal Daily Word
          </button>
          <button type="button" className="secondary" onClick={word.refresh}>
            Refresh
          </button>
        </div>
      </ContentSurface>
    )
  return <DailyWordBoard initial={word.data} word={word} onInstall={onInstall} />
}
function DailyWordBoard({
  initial,
  word,
  onInstall,
}: {
  initial: WordSnapshot
  word: ReturnType<typeof useDailyWord>
  onInstall: () => void
}) {
  const [board, setBoard] = useState(initial),
    [draft, setDraft] = useState(''),
    [message, setMessage] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [help, setHelp] = useState(false),
    [remove, setRemove] = useState(false)
  const [unresolved, setUnresolved] = useState(false)
  const request = useRef<{ action: WordWrite['action']; body: object } | null>(null)
  const input = useRef<HTMLInputElement>(null),
    now = useNow()
  const guard = useDraftGuard(!!draft || !!request.current, word.pending)
  const latest = word.data
  const changedDay = !!latest && latest.day !== board.day
  const conflict =
    !!latest &&
    (latest.installationVersion !== board.installationVersion ||
      (latest.day === board.day && latest.progress.revision !== board.progress.revision))
  const removal = word.removals['daily-word']
  const uncertain = !!request.current && unresolved
  const locked =
    word.pending ||
    word.offline ||
    !!removal ||
    changedDay ||
    conflict ||
    board.progress.finished ||
    uncertain
  useEffect(() => {
    if (latest && latest.day === board.day && !draft && !request.current && !word.pending)
      setBoard(latest)
  }, [latest, board.day, draft, word.pending, unresolved])
  const clockReceived = useRef({ clock: initial.clock, at: Date.now() })
  useEffect(() => {
    if (latest) clockReceived.current = { clock: latest.clock, at: Date.now() }
  }, [latest])
  useEffect(() => {
    const { clock, at } = clockReceived.current
    if (now >= at + Date.parse(clock.nextMidnight) - Date.parse(clock.serverTime) && !word.pending)
      word.refresh()
  }, [now, word.pending])
  function edit(next: string) {
    if (locked) return
    setDraft(
      next
        .replace(/[^a-z]/gi, '')
        .slice(0, 5)
        .toUpperCase(),
    )
    setMessage('')
    setAnnouncement('')
    request.current = null
    word.clearError()
  }
  async function send(action: WordWrite['action'], retry = false) {
    if (word.pending || word.offline || removal) return
    if (action === 'guess' && !retry && draft.length !== 5) {
      setMessage('Enter five letters before submitting.')
      input.current?.focus()
      return
    }
    if (!retry)
      request.current = {
        action,
        body: {
          version: board.installationVersion,
          day: board.day,
          revision: board.progress.revision,
          ...(action === 'guess' ? { guess: draft.toLowerCase() } : {}),
          requestKey: crypto.randomUUID(),
        },
      }
    const pending = request.current
    if (!pending) return
    setUnresolved(true)
    const result = await word.write(pending.action, pending.body)
    const receipt = result?.receipt
    if (result?.failure && result.failure.status > 0 && result.failure.status < 500)
      setUnresolved(false)
    if (receipt) {
      setUnresolved(false)
      request.current = null
      if (pending.action === 'guess') {
        setDraft('')
        const accepted = receipt.progress?.guesses.at(-1)
        setMessage(
          accepted
            ? `${accepted.word.toUpperCase()} saved · ${receipt.progress!.guesses.length} / 6`
            : 'Your guess is saved.',
        )
        setAnnouncement(
          accepted
            ? `${accepted.word.toUpperCase()} saved. ${accepted.marks.map((mark, i) => `${accepted.word[i].toUpperCase()}: ${descriptions[mark]}`).join('; ')}.`
            : 'Your guess is saved.',
        )
        input.current?.focus()
      } else {
        setAnnouncement('')
        setMessage(
          pending.action === 'share'
            ? 'Your finished result is shared.'
            : 'Your result is private again.',
        )
      }
      // The hook refreshed current server state; immutable receipts may describe an older revision/day.
    }
  }
  function loadLatest() {
    if (!latest || unresolved) return
    guard.close(() => {
      setBoard(latest)
      request.current = null
      setUnresolved(false)
      setDraft('')
      setMessage('Latest board loaded.')
      setAnnouncement('')
      word.clearError()
    })
  }
  const keyboard: Record<string, WordMark> = {}
  const rank = { absent: 0, present: 1, correct: 2 }
  board.progress.guesses.forEach((guess) =>
    [...guess.word].forEach((letter, i) => {
      const mark = guess.marks[i]
      if (!keyboard[letter] || rank[mark] > rank[keyboard[letter]]) keyboard[letter] = mark
    }),
  )
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(board.day + 'T12:00:00Z')
    day.setUTCDate(day.getUTCDate() - 6 + i)
    return day.toISOString().slice(0, 10)
  })
  if (!board.installed)
    return (
      <ContentSurface>
        <h2>Daily Word was removed</h2>
        <p>Your saved attempts and history are kept.</p>
        <button type="button" disabled={word.pending || word.offline} onClick={onInstall}>
          Reinstall personal Daily Word
        </button>
      </ContentSurface>
    )
  return (
    <ContentSurface className="daily-word">
      <header className="dw-heading">
        <div>
          <p className="eyebrow">A little room for word play</p>
          <h2>Daily Word</h2>
          <p>Five letters. Six chances. One word together.</p>
        </div>
        <button type="button" className="secondary" onClick={() => setHelp(true)}>
          How to play
        </button>
      </header>
      <RemovalNotice removal={removal} />
      {(changedDay || conflict) && (
        <div role="status" className="dw-notice">
          <p>
            {changedDay
              ? 'A new London day has started. Your previous board and typed word are kept here.'
              : 'Your board or installation changed in another window. Your typed word is kept here.'}
          </p>
          <button type="button" disabled={word.pending || unresolved} onClick={loadLatest}>
            {changedDay ? 'Open today’s word' : 'Load latest board'}
          </button>
        </div>
      )}
      <div className="dw-layout">
        <section className="dw-play" aria-label={'Your private board for ' + board.day}>
          <div className="dw-meta">
            <time dateTime={board.day}>
              {new Date(board.day + 'T12:00:00Z').toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'Europe/London',
              })}
            </time>
            <span>Personal · {board.progress.guesses.length} / 6</span>
          </div>
          <ol className="dw-board" aria-label="Accepted guesses and current word">
            {Array.from({ length: 6 }, (_, r) => {
              const accepted = board.progress.guesses[r]
              const letters =
                accepted?.word.toUpperCase() ?? (r === board.progress.guesses.length ? draft : '')
              return (
                <li
                  className="dw-row"
                  key={r}
                  aria-label={`Guess ${r + 1}${accepted ? ', saved' : ', not submitted'}`}
                >
                  {Array.from({ length: 5 }, (_, c) => {
                    const mark = accepted?.marks[c]
                    return (
                      <span
                        key={c}
                        role="img"
                        className={'dw-tile' + (mark ? ' dw-' + mark : '')}
                        aria-label={`${letters[c] ?? 'empty'}${mark ? ', ' + descriptions[mark] : ''}`}
                      >
                        <span aria-hidden="true">{letters[c] ?? ''}</span>
                        {mark && <small aria-hidden="true">{symbols[mark]}</small>}
                      </span>
                    )
                  })}
                </li>
              )
            })}
          </ol>
          <p className="dw-legend">
            <span>✓ Correct place</span>
            <span>↔ Elsewhere</span>
            <span>· Absent</span>
          </p>
          {board.progress.finished && (
            <p className="dw-completion" role="status">
              {board.progress.solved
                ? `Solved in ${board.progress.guesses.length} of 6. Your finish is saved.`
                : 'No match today. All six guesses are saved. A fresh word arrives after midnight in London.'}
            </p>
          )}
          {!board.progress.finished && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (!locked) void send('guess')
              }}
              className="dw-entry"
            >
              <label htmlFor="daily-word-guess">Your next guess</label>
              <div>
                <input
                  ref={input}
                  id="daily-word-guess"
                  value={draft}
                  onChange={(event) => edit(event.target.value)}
                  maxLength={5}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode="text"
                  readOnly={locked}
                  aria-describedby="dw-irreversible"
                />
                <button type="submit" disabled={locked || draft.length !== 5}>
                  {word.pending ? 'Saving…' : 'Enter guess'}
                </button>
              </div>
            </form>
          )}
          <p id="dw-irreversible" className="note">
            Each accepted guess is saved immediately and cannot be undone. Invalid or repeated words
            use no attempt.
          </p>
          <div>
            {message ||
              (word.pending
                ? 'Saving your choice…'
                : board.progress.finished
                  ? board.progress.solved
                    ? `Solved in ${board.progress.guesses.length} of 6. Your finish is saved.`
                    : 'Today’s word is finished. Your six guesses are saved.'
                  : '')}
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {announcement || message}
          </p>
          {word.error && (
            <p role="alert" className="error">
              {word.error}
            </p>
          )}
          {request.current && !word.pending && (word.failure || unresolved) && (
            <div className="dw-notice">
              <p>
                {uncertain
                  ? 'The response was not confirmed. Keep this word and retry the same request to find out whether it saved.'
                  : 'Your typed word is kept. You can retry or load the latest board before continuing.'}
              </p>
              <div className="actions">
                <button
                  type="button"
                  disabled={word.offline || !!removal}
                  onClick={() => void send(request.current!.action, true)}
                >
                  Retry same request
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={word.refresh}
                  disabled={word.offline}
                >
                  Refresh status
                </button>
                {!uncertain && (
                  <button type="button" className="secondary" onClick={loadLatest}>
                    Load latest board
                  </button>
                )}
              </div>
            </div>
          )}
          {!board.progress.finished && (
            <div className="dw-keyboard" role="group" aria-label="Letter keyboard">
              {rows.map((row) => (
                <div className="dw-key-row" key={row}>
                  {[...row].map((letter) => {
                    const mark = keyboard[letter.toLowerCase()]
                    return (
                      <button
                        type="button"
                        key={letter}
                        className={mark ? 'dw-' + mark : 'secondary'}
                        disabled={locked}
                        aria-label={letter + (mark ? ', ' + descriptions[mark] : '')}
                        onClick={() => edit(draft + letter)}
                      >
                        {letter}
                        {mark && <small aria-hidden="true">{symbols[mark]}</small>}
                      </button>
                    )
                  })}
                </div>
              ))}
              <div className="dw-key-row">
                <button
                  type="button"
                  className="secondary dw-wide-key"
                  disabled={locked || !draft}
                  onClick={() => edit(draft.slice(0, -1))}
                >
                  ⌫ Backspace
                </button>
                <button
                  type="button"
                  className="dw-wide-key"
                  disabled={locked || draft.length !== 5}
                  onClick={() => void send('guess')}
                >
                  Enter
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="dw-rail">
          <section>
            <p className="eyebrow">Your daily desk</p>
            <h3>
              {board.progress.finished
                ? board.progress.solved
                  ? 'A word well found.'
                  : 'A good day to try.'
                : 'Take it one letter at a time.'}
            </h3>
            <p>There’s a fresh word after midnight in London. Play at your own pace.</p>
          </section>
          <section>
            <h3>Your last seven days</h3>
            <ol className="dw-week">
              {week.map((date) => {
                const day = latest?.week.find((item) => item.date === date)
                return (
                  <li key={date}>
                    <time dateTime={date}>
                      {new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', {
                        weekday: 'short',
                        timeZone: 'UTC',
                      })}
                    </time>
                    <strong>{day?.solved ? '✓' : day?.finished ? '6' : day ? '…' : '—'}</strong>
                    <span>
                      {day?.solved
                        ? 'Solved'
                        : day?.finished
                          ? 'Finished'
                          : day
                            ? 'Playing'
                            : 'Unplayed'}
                    </span>
                  </li>
                )
              })}
            </ol>
            <p className="note">Only you can see your play history.</p>
          </section>
          <section>
            <h3>A result to share</h3>
            <p>
              {board.progress.shared
                ? 'Your finished result is visible to family. Your words stay private.'
                : 'Your progress stays private. After finishing, you can share just the date, outcome and attempt count.'}
            </p>
            {board.progress.finished && (
              <button
                type="button"
                disabled={
                  word.pending || word.offline || !!removal || changedDay || conflict || uncertain
                }
                onClick={() => void send(board.progress.shared ? 'withdraw' : 'share')}
              >
                {board.progress.shared ? 'Withdraw shared result' : 'Share finished result'}
              </button>
            )}
            <Link to={WORD_RESULTS_PATH}>Family results</Link>
          </section>
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={word.pending || word.offline}
              onClick={word.refresh}
            >
              Refresh
            </button>
            <button
              type="button"
              className="secondary"
              disabled={word.pending || !!removal}
              onClick={() => guard.close(() => setRemove(true))}
            >
              Remove Daily Word
            </button>
          </div>
        </aside>
      </div>
      {help && (
        <Modal title="How to play Daily Word" onClose={() => setHelp(false)}>
          <p>
            Find today’s five-letter word in up to six accepted guesses. The family gets the same
            word each London day.
          </p>
          <p>
            ✓ means the letter is in the correct place. ↔ means it appears elsewhere. · means that
            copy of the letter is absent. Repeated letters count only as often as they appear in the
            answer.
          </p>
          <p>
            Type into the guess field or use the letter buttons. Enter saves one guess; Backspace
            edits only your current word. No hints, restart or undo for saved guesses.
          </p>
          <p>
            Unrecognised words and words you already tried do not use an attempt. Removing and
            reinstalling keeps today’s attempts.
          </p>
          <p>
            Your board and seven-day history are private. Finished results are shared only when you
            choose, and can be withdrawn.
          </p>
          <p className="note">
            British-English dictionary: ESDB / SCOWL 2026.02.25, Copyright 2000–2026 Kevin Atkinson.
            A curated common-word answer list and broader accepted-guess list are stored on the
            server.
          </p>
        </Modal>
      )}
      {remove && (
        <RemovalConfirmation
          item={{ id: 'daily-word', title: 'Daily Word', version: board.installationVersion }}
          noun="Daily Word installation"
          history="Your attempts and history are kept. Shared results stay visible until you withdraw them."
          busy={word.pending}
          error={word.error}
          schedule={word.remove}
          onClose={() => setRemove(false)}
        />
      )}
    </ContentSurface>
  )
}
