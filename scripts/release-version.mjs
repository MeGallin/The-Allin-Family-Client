import { readFileSync, writeFileSync } from 'node:fs'

// An explicit target makes retrying this command idempotent.
const source = new URL('../src/app-version.json', import.meta.url)
const pattern = /^(0|[1-9]\d*)\.\d{1,2}$/
const target = process.argv[2]
const current = JSON.parse(readFileSync(source, 'utf8')).version
if (
  process.argv.length !== 3 ||
  !pattern.test(target || '') ||
  typeof current !== 'string' ||
  !pattern.test(current)
) {
  throw new Error('Usage: npm run release:version -- <version> (for example 0.15)')
}
const units = (value) => {
  const [whole, fraction] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}
const next = units(current) + 5n
const nextVersion = `${next / 100n}.${String(next % 100n).padStart(2, '0')}`
if (target !== current && target !== nextVersion) {
  throw new Error(`Set the current version ${current} again, or the next release ${nextVersion}.`)
}
if (target !== current) {
  writeFileSync(source, JSON.stringify({ version: target }, null, 2) + '\n')
}
console.log(
  `App release ${target}: ${target === current ? 'unchanged' : 'updated src/app-version.json'}.`,
)
