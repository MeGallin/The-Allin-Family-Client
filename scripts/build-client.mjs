import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  CLIENT_VERSION_ENV,
  CLIENT_VERSION_MANIFEST,
  nextClientVersion,
} from './client-version.mjs'

function runNode(file, args, options) {
  const result = spawnSync(process.execPath, [file, ...args], { ...options, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`Client build command failed (exit ${result.status ?? result.signal})`)
}

/** One successful client build is one version increment; packaging calls this once. */
export function buildClient(root, args = [], run = runNode) {
  // Preserve the supported base override, without allowing a second config/output/define path.
  if (!(
    args.length === 0 ||
    (args.length === 1 && /^--base=.+$/.test(args[0])) ||
    (args.length === 2 && args[0] === '--base' && args[1] && !args[1].startsWith('-'))
  ))
    throw new Error('Use npm run build, optionally with -- --base=/')
  const source = resolve(root, 'src/app-version.json')
  const lockPath = resolve(root, '.client-build.lock')
  const temporaryVersion = resolve(root, '.client-build-version.tmp')
  let lock
  let temporaryOwned = false
  try {
    lock = openSync(lockPath, 'wx')
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new Error(
        'Another client build owns .client-build.lock. If interrupted, confirm it has stopped before removing the lock.',
      )
    throw error
  }
  try {
    const original = readFileSync(source, 'utf8')
    const metadata = JSON.parse(original)
    const next = nextClientVersion(metadata.version)
    const options = { cwd: root, env: { ...process.env, [CLIENT_VERSION_ENV]: next } }
    run(resolve(root, 'node_modules/typescript/bin/tsc'), ['--noEmit'], options)
    run(resolve(root, 'node_modules/vite/bin/vite.js'), ['build', ...args], options)
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'dist', CLIENT_VERSION_MANIFEST), 'utf8'),
    )
    if (manifest.version !== next)
      throw new Error('Client build version does not match its output manifest')
    if (readFileSync(source, 'utf8') !== original)
      throw new Error('Client version source changed during the build')
    writeFileSync(
      temporaryVersion,
      JSON.stringify({ ...metadata, version: next }, null, 2) + '\n',
      { flag: 'wx' },
    )
    temporaryOwned = true
    renameSync(temporaryVersion, source)
    console.log(`Client build ${next} succeeded; src/app-version.json updated.`)
    return next
  } finally {
    try {
      if (temporaryOwned && existsSync(temporaryVersion)) unlinkSync(temporaryVersion)
    } finally {
      closeSync(lock)
      unlinkSync(lockPath)
    }
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    buildClient(resolve(dirname(fileURLToPath(import.meta.url)), '..'), process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
