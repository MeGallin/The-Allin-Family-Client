export const CLIENT_VERSION_ENV = 'ALLIN_CLIENT_BUILD_VERSION'
export const CLIENT_VERSION_MANIFEST = 'client-version.json'

export function nextClientVersion(current) {
  if (typeof current !== 'string' || !/^(0|[1-9]\d*)\.\d{1,2}$/.test(current))
    throw new Error('Invalid client version in src/app-version.json')
  const [whole, fraction] = current.split('.')
  const next = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')) + 5n
  return `${next / 100n}.${String(next % 100n).padStart(2, '0')}`
}
