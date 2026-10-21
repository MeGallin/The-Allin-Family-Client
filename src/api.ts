export type Health = { status: 'ok'; service: string }

export async function getHealth(signal: AbortSignal): Promise<Health> {
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  const response = await fetch(`${base}/health`, {
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`API returned HTTP ${response.status}.`)

  const data: unknown = await response.json()
  if (
    typeof data !== 'object' || data === null ||
    !('status' in data) || data.status !== 'ok' ||
    !('service' in data) || typeof data.service !== 'string'
  ) {
    throw new Error('The API returned an unexpected response.')
  }

  return { status: 'ok', service: data.service }
}
