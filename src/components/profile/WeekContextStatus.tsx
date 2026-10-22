import type { WeekContext } from '../../features/week-context/types'
import { FriendlyTime } from '../ui/FriendlyTime'
import './WeekContextStatus.css'

export function WeekContextStatus({
  data,
  loading,
  error,
  retry,
}: {
  data?: WeekContext
  loading: boolean
  error: boolean
  retry: () => void
}) {
  return (
    <div className="week-context-status" aria-live="polite">
      {loading ? (
        <span>Loading weather and bank holidays…</span>
      ) : error ? (
        <span>
          Weather and bank holidays are unavailable.{' '}
          <button type="button" className="text-button" onClick={retry}>
            Try again
          </button>
        </span>
      ) : (
        data && (
          <>
            <span>
              {data.weather.location
                ? `Weather for ${data.weather.location}`
                : 'Weather switched off'}
              {data.weather.updatedAt && (
                <>
                  {' '}
                  · {data.weather.status === 'stale' ? 'Saved forecast' : 'Updated'}{' '}
                  <FriendlyTime value={data.weather.updatedAt} />
                </>
              )}
              {data.weather.status === 'unavailable' && ' · Forecast unavailable'}
            </span>
            <span>
              {data.holidays.region
                ? `Bank holidays: ${data.holidays.region}`
                : 'UK bank holidays switched off'}
              {data.holidays.status === 'stale' && ' · Saved dates'}
              {data.holidays.status === 'unavailable' && ' · Dates unavailable'}
            </span>
            <span className="week-context-status__sources">
              <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
                Open-Meteo
              </a>
              <span> · </span>
              <a href="https://www.gov.uk/bank-holidays" target="_blank" rel="noopener noreferrer">
                GOV.UK
              </a>
            </span>
          </>
        )
      )}
    </div>
  )
}
