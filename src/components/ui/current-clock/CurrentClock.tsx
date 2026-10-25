import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { Icon } from '../Icon'
import {
  clockStorageKey,
  readClockPreference,
  saveClockPreference,
  type ClockPreference,
} from './clock-preferences'
import { useClockTime } from './useClockTime'
import './CurrentClock.css'

/** Presentation-only local time; remount state before rendering another owner's choices. */
export function CurrentClock({ ownerId }: { ownerId: number }) {
  return <OwnerClock key={ownerId} ownerId={ownerId} />
}
function OwnerClock({ ownerId }: { ownerId: number }) {
  const [preference, setPreference] = useState(() => readClockPreference(ownerId))
  const [unsaved, setUnsaved] = useState(false)
  const now = new Date(useClockTime())
  const hours = now.getHours(),
    minutes = now.getMinutes(),
    seconds = now.getSeconds()
  const pad = (value: number) => String(value).padStart(2, '0')
  const hour = preference.hour12 ? hours % 12 || 12 : hours
  const period = preference.hour12 ? (hours < 12 ? 'AM' : 'PM') : ''
  const time = `${pad(hour)}:${pad(minutes)}:${pad(seconds)}${period ? ` ${period}` : ''}`
  useEffect(() => {
    function sync(event: StorageEvent) {
      try {
        if (
          event.storageArea !== localStorage ||
          (event.key !== null && event.key !== clockStorageKey(ownerId))
        )
          return
      } catch {
        return
      }
      setPreference(readClockPreference(ownerId))
      setUnsaved(false)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [ownerId])
  function choose(value: ClockPreference) {
    setPreference(value)
    setUnsaved(!saveClockPreference(ownerId, value))
  }
  return (
    <div className="current-clock">
      <div className="current-clock__row">
        {preference.analogue && (
          <svg
            className="current-clock__face"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="24" cy="24" r="22" className="current-clock__rim" />
            <circle cx="24" cy="24" r="20.5" className="current-clock__bezel" />
            <circle cx="24" cy="24" r="19.5" className="current-clock__dial" />
            {Array.from({ length: 60 }, (_, minute) => {
              const hourMark = minute % 5 === 0
              const cardinal = minute % 15 === 0
              return (
                <path
                  key={minute}
                  d={cardinal ? 'M24 5.5V9' : hourMark ? 'M24 5.5V8' : 'M24 5.5V6.5'}
                  transform={`rotate(${minute * 6} 24 24)`}
                  className={
                    cardinal
                      ? 'current-clock__mark current-clock__mark--cardinal'
                      : hourMark
                        ? 'current-clock__mark'
                        : 'current-clock__tick'
                  }
                />
              )
            })}
            <path
              d="M22.9 25.5L23.15 15Q24 13.2 24.85 15L25.1 25.5Z"
              transform={`rotate(${(hours % 12) * 30 + minutes * 0.5 + seconds / 120} 24 24)`}
              className="current-clock__hand"
            />
            <path
              d="M23.4 26L23.55 10.5Q24 9 24.45 10.5L24.6 26Z"
              transform={`rotate(${minutes * 6 + seconds * 0.1} 24 24)`}
              className="current-clock__hand current-clock__minute"
            />
            <path
              d="M24 28V8.5"
              transform={`rotate(${seconds * 6} 24 24)`}
              className="current-clock__second"
            />
            <circle cx="24" cy="24" r="2" className="current-clock__cap" />
            <circle cx="24" cy="24" r=".8" className="current-clock__pin" />
          </svg>
        )}
        <time
          className={preference.analogue ? 'sr-only' : 'current-clock__time'}
          dateTime={`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
          role="timer"
          aria-live="off"
          aria-label={`Your local time, ${time}`}
        >
          <span>
            {pad(hour)}:{pad(minutes)}
            <span className="current-clock__seconds">:{pad(seconds)}</span>
          </span>
          {period && <span className="current-clock__period">{period}</span>}
        </time>
        <div className="current-clock__controls" role="group" aria-label="Clock display">
          <button
            type="button"
            className="current-clock__control secondary"
            aria-label="Analogue clock"
            aria-pressed={preference.analogue}
            title={preference.analogue ? 'Show digital clock' : 'Show analogue clock'}
            onClick={() => choose({ ...preference, analogue: !preference.analogue })}
          >
            <Icon icon={Clock3} />
          </button>
          {!preference.analogue && (
            <button
              type="button"
              className="current-clock__control secondary"
              aria-label="12-hour time"
              aria-pressed={preference.hour12}
              title={preference.hour12 ? 'Use 24-hour time' : 'Use 12-hour time'}
              onClick={() => choose({ ...preference, hour12: !preference.hour12 })}
            >
              {preference.hour12 ? '12h' : '24h'}
            </button>
          )}
        </div>
      </div>
      {unsaved && (
        <span className="current-clock__notice" role="status">
          Clock choice lasts for this visit.
        </span>
      )}
    </div>
  )
}
