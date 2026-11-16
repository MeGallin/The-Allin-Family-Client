import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { buildClient } from './build-client.mjs'
import { CLIENT_VERSION_ENV, nextClientVersion } from './client-version.mjs'

const fixtures = []
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'allin-client-build-'))
  fixtures.push(root)
  mkdirSync(join(root, 'src'))
  mkdirSync(join(root, 'dist'))
  writeFileSync(
    join(root, 'src/app-version.json'),
    JSON.stringify({ version: '0.15', retained: 'metadata' }) + '\n',
  )
  return root
}
const metadata = (root) => JSON.parse(readFileSync(join(root, 'src/app-version.json'), 'utf8'))
const successful = (file, args, options) => {
  if (basename(file) === 'vite.js')
    writeFileSync(
      join(options.cwd, 'dist/client-version.json'),
      JSON.stringify({ version: options.env[CLIENT_VERSION_ENV] }),
    )
}
afterEach(() => {
  for (const root of fixtures.splice(0)) {
    assert.ok(
      resolve(root).startsWith(resolve(tmpdir()) + '\\') ||
        resolve(root).startsWith(resolve(tmpdir()) + '/'),
    )
    assert.ok(basename(root).startsWith('allin-client-build-'))
    rmSync(root, { recursive: true, force: true })
  }
})

test('adds exactly five hundredths without floating-point loss, including decimal carry', () => {
  for (const [current, expected] of [
    ['0.1', '0.15'],
    ['0.15', '0.20'],
    ['0.95', '1.00'],
    ['9007199254740991.95', '9007199254740992.00'],
  ])
    assert.equal(nextClientVersion(current), expected)
  for (const invalid of ['0.150', '01.15', 'invalid', 0.15, null])
    assert.throws(() => nextClientVersion(invalid))
})
test('bundles the next candidate, advances once on success, and preserves other metadata', () => {
  const root = fixture()
  const calls = []
  const run = (file, args, options) => {
    calls.push({ file, args, candidate: options.env[CLIENT_VERSION_ENV] })
    assert.equal(metadata(root).version, '0.15')
    successful(file, args, options)
  }
  assert.equal(buildClient(root, ['--base=/'], run), '0.20')
  assert.deepEqual(metadata(root), { version: '0.20', retained: 'metadata' })
  assert.equal(calls.length, 2)
  assert.deepEqual(
    calls.map((call) => call.candidate),
    ['0.20', '0.20'],
  )
  assert.deepEqual(calls[1].args, ['build', '--base=/'])
  assert.equal(buildClient(root, [], successful), '0.25')
  assert.equal(metadata(root).version, '0.25')
  assert.equal(existsSync(join(root, '.client-build.lock')), false)
})
for (const failure of ['tsc', 'vite.js'])
  test(`a failed ${failure} leaves version unchanged and releases the build lock`, () => {
    const root = fixture()
    const before = readFileSync(join(root, 'src/app-version.json'), 'utf8')
    assert.throws(
      () =>
        buildClient(root, [], (file) => {
          if (basename(file) === failure) throw new Error('synthetic failure')
        }),
      /synthetic failure/,
    )
    assert.equal(readFileSync(join(root, 'src/app-version.json'), 'utf8'), before)
    assert.equal(existsSync(join(root, '.client-build.lock')), false)
  })
for (const value of [null, '0.15'])
  test(`missing/mismatched output ${value} does not advance the version`, () => {
    const root = fixture()
    if (value)
      writeFileSync(join(root, 'dist/client-version.json'), JSON.stringify({ version: value }))
    assert.throws(() => buildClient(root, [], () => {}))
    assert.equal(metadata(root).version, '0.15')
  })
test('rejects a nested concurrent build without double advancing', () => {
  const root = fixture()
  assert.equal(
    buildClient(root, [], (file, args, options) => {
      assert.throws(() => buildClient(root, [], successful), /Another client build/)
      successful(file, args, options)
    }),
    '0.20',
  )
})
test('does not overwrite metadata changed independently during a build', () => {
  const root = fixture()
  assert.throws(
    () =>
      buildClient(root, [], (file, args, options) => {
        successful(file, args, options)
        if (basename(file) === 'vite.js')
          writeFileSync(join(root, 'src/app-version.json'), '{"version":"0.18"}')
      }),
    /source changed/,
  )
  assert.equal(metadata(root).version, '0.18')
})
test('forbids alternate config, output and define paths that could bypass output identity', () => {
  const root = fixture()
  for (const args of [
    ['--config=other.js'],
    ['--outDir=other'],
    ['--define=__CLIENT_BUILD_VERSION__="9.99"'],
  ])
    assert.throws(() => buildClient(root, args, successful), /Use npm run build/)
  assert.equal(metadata(root).version, '0.15')
})
test('does not delete an unowned temporary metadata file on a failed write', () => {
  const root = fixture()
  const file = join(root, '.client-build-version.tmp')
  writeFileSync(file, 'unowned stale file')
  assert.throws(() => buildClient(root, [], successful), /EEXIST/)
  assert.equal(metadata(root).version, '0.15')
  assert.equal(readFileSync(file, 'utf8'), 'unowned stale file')
  assert.equal(existsSync(join(root, '.client-build.lock')), false)
})
