import release from '../../app-version.json'
declare const __CLIENT_BUILD_VERSION__: string | undefined
const version =
  typeof __CLIENT_BUILD_VERSION__ === 'string' ? __CLIENT_BUILD_VERSION__ : release.version
if (!/^(0|[1-9]\d*)\.\d{1,2}$/.test(version)) throw new Error('Invalid bundled client version')

export function useReleaseVersion() {
  return version
}
