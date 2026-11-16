import { readFileSync, readdirSync } from 'node:fs'
import { relative, join } from 'node:path'
import { expect, it } from 'vitest'

const boundary = 'src/styles/runtime-styles.ts'
function violations(path: string, text: string): string[] {
  const result: string[] = []
  if (/\.(?:html|svg)$/i.test(path)) {
    if (/\bstyle\s*=|<style\b/i.test(text)) result.push('inline markup style')
    return result
  }
  // Deliberately conservative source guard, not a JavaScript taint analyser.
  // Keep the sole CSSStyleRule writer narrow; element.style is forbidden even there.
  const checked = path === boundary ? text.replace(/\brule\.style\b/g, 'cssRuleDeclarations') : text
  const patterns = [
    /\b(?:style|wrapperStyle|contentStyle|itemStyle|labelStyle)\s*=\s*[{"'`]/,
    /\.(?:style|cssText)\b/,
    /\[\s*["'`](?:style|cssText)["'`]\s*\]/,
    /(?:setAttribute(?:NS)?|createElement(?:NS)?)\s*\([^)]*["'`]style["'`]/i,
    /<style\b/i,
    /[{,]\s*["'`]?(?:style|wrapperStyle|contentStyle|itemStyle|labelStyle)["'`]?\s*:\s*(?:\{|[a-zA-Z_$])/,
    /[{,]\s*style\s*[,}]/,
  ]
  if (patterns.some((pattern) => pattern.test(checked))) result.push('inline style pattern')
  if (
    path !== boundary &&
    /\bnew\s+CSSStyleSheet\b|\.(?:insertRule|addRule|replaceSync)\s*\(/.test(text)
  )
    result.push('stylesheet outside boundary')
  return result
}
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
  )
}

it('keeps all first-party production source and markup free of inline styles', () => {
  const inputs = [...files('src'), ...files('public'), 'index.html'].filter(
    (path) => /\.(?:[jt]sx?|html|svg)$/i.test(path) && !/\.test\.[jt]sx?$/.test(path),
  )
  const found = inputs.flatMap((path) =>
    violations(path.replace(/\\/g, '/'), readFileSync(path, 'utf8')).map(
      (reason) => `${relative('.', path)}: ${reason}`,
    ),
  )
  expect(found).toEqual([])
})

it.each([
  '<div style={{ color: "red" }} />',
  'node.style.setProperty("color", "red")',
  'node["style"] = value',
  'node.setAttribute("style", value)',
  'node.style.cssText = value',
  'document.createElement("style")',
  'const props = {style: value}; <div {...props} />',
  '<Tooltip wrapperStyle={{ color: "red" }} />',
])('rejects forbidden first-party pattern: %s', (source) => {
  expect(violations('src/example.tsx', source).length).toBeGreaterThan(0)
})

it('rejects inline SVG/HTML styles while permitting presentation geometry and the audited CSSRule boundary', () => {
  expect(violations('public/icon.svg', '<svg style="color:red"/>')).not.toEqual([])
  expect(violations('index.html', '<style>body{color:red}</style>')).not.toEqual([])
  expect(
    violations('public/icon.svg', '<svg><path fill="currentColor" transform="rotate(30)"/></svg>'),
  ).toEqual([])
  expect(violations(boundary, 'rule.style.setProperty(name, value)')).toEqual([])
  expect(violations(boundary, 'element.style.setProperty(name, value)')).not.toEqual([])
})
