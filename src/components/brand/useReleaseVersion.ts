import { useEffect, useState } from 'react'
import { request } from '../../services/api-client'
import { withRequestTimeout } from '../../services/request-timeout'
import release from '../../app-version.json'

function releaseUnits(value: unknown): bigint | null {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.\d{1,2}$/.test(value)) return null
  const [whole, fraction] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}

if (releaseUnits(release.version) === null) throw new Error('Invalid bundled app release version')

export function useReleaseVersion() {
  const [version, setVersion] = useState(release.version)
  useEffect(() => {
    let controller: AbortController | undefined
    const refresh = async () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      try {
        const release = await withRequestTimeout(
          (boundedSignal) => request<{ version?: unknown }>('/version', undefined, boundedSignal),
          signal,
          10000,
        )
        const remote = releaseUnits(release.version)
        if (!signal.aborted && remote !== null) {
          setVersion((current) =>
            remote > releaseUnits(current)! ? String(release.version) : current,
          )
        }
      } catch {
        // Offline, maintenance or an older API: retain the bundled/last known release.
      }
    }
    const onFocus = () => {
      void refresh()
    }
    void refresh()
    const interval = setInterval(onFocus, 300000)
    window.addEventListener('focus', onFocus)
    return () => {
      controller?.abort()
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])
  return version
}
