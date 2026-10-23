import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { WeatherDay } from '../../../features/week-context/types'
import { weatherCondition } from '../../../features/week-context/weather-view'
import { Modal } from '../../ui/Modal'
import { Icon } from '../../ui/Icon'
import { FriendlyTime } from '../../ui/FriendlyTime'
import './DayWeather.css'

export function DayWeather({
  day,
  location,
  updatedAt,
  stale,
  timeZone,
}: {
  day: WeatherDay
  location: string
  updatedAt: string | null
  stale: boolean
  timeZone: string
}) {
  const [open, setOpen] = useState(false)
  const condition = weatherCondition(day.code)
  return (
    <>
      <button
        type="button"
        className="day-weather"
        title={`View forecast · ${format(parseISO(day.date), 'EEEE d MMMM')} · ${condition.label}, high ${day.high}°C, low ${day.low}°C, ${day.rain}% chance of rain${stale ? ' · saved forecast' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={`Forecast for ${format(parseISO(day.date), 'EEEE d MMMM')} in ${location}: ${condition.label}, high ${day.high}°C, low ${day.low}°C, ${day.rain}% chance of rain${stale ? ', saved forecast' : ''}`}
      >
        <span className="day-weather__preview">
          <span className="day-weather__temperatures">
            <Icon icon={condition.icon} />
            <strong>{day.high}°</strong>
            <span>{day.low}°</span>
          </span>
          <small>{day.rain}% rain</small>
        </span>
      </button>
      {open && (
        <Modal title={format(parseISO(day.date), 'EEEE, d MMMM')} onClose={() => setOpen(false)}>
          <div className="day-weather__detail">
            <p className="day-weather__location">
              {location} · {timeZone}
            </p>
            <Icon icon={condition.icon} />
            <h3>{condition.label}</h3>
            <dl>
              <div>
                <dt>High / low</dt>
                <dd>
                  {day.high}° / {day.low}°C
                </dd>
              </div>
              <div>
                <dt>Chance of rain</dt>
                <dd>{day.rain}%</dd>
              </div>
            </dl>
            <p>
              {stale ? 'Saved forecast · ' : 'Updated '}
              {updatedAt && <FriendlyTime value={updatedAt} />}. Forecasts can change.
            </p>
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
              Weather data by Open-Meteo
            </a>
          </div>
        </Modal>
      )}
    </>
  )
}
