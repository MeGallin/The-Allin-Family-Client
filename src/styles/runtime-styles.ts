import { useId, useInsertionEffect, useMemo } from 'react'

const properties = [
  'background',
  'transform',
  'left',
  'top',
  'bottom',
  'height',
  '--color-accent',
  '--color-accent-highlight',
  '--color-accent-soft',
  '--color-text-on-action',
  '--picker-hue',
  '--picker-x',
  '--picker-y',
  '--family-header-mascot-start',
  '--family-header-mascot-end',
] as const
export type RuntimeStyles = Partial<Record<(typeof properties)[number], string>>
const allowed = new Set<string>(properties)
const sheets = new WeakMap<Document, CSSStyleSheet>()

function sheetFor(document: Document) {
  let sheet = sheets.get(document)
  if (!sheet) {
    sheet = new CSSStyleSheet()
    document.adoptedStyleSheets = [...(document.adoptedStyleSheets ?? []), sheet]
    sheets.set(document, sheet)
  }
  return sheet
}

/** The only first-party runtime CSS writer. Never writes DOM style attributes/tags.
 * Values are assigned through CSSStyleDeclaration, never interpolated into rules.
 */
export function useRuntimeRule({ rootAccent = false } = {}) {
  const id = useId()
  const className =
    'nimbus-runtime-' + Array.from(id, (char) => char.charCodeAt(0).toString(16)).join('-')
  const controller = useMemo(() => {
    let rule: CSSStyleRule | undefined
    let sheet: CSSStyleSheet | undefined
    const remove = () => {
      if (rule && sheet) {
        const index = Array.from(sheet.cssRules).indexOf(rule)
        if (index !== -1) sheet.deleteRule(index)
      }
      rule = undefined
    }
    return {
      className,
      remove,
      update(declarations: RuntimeStyles) {
        const entries = Object.entries(declarations)
        // Validate the whole update before changing an existing rule.
        for (const [name, value] of entries) {
          if (
            !allowed.has(name) ||
            typeof value !== 'string' ||
            /[;{}<>\\]|\/\*|!important|url\s*\(|expression\s*\(|@import|(?:NaN|Infinity)/i.test(
              value,
            )
          )
            throw new Error('Unsupported runtime CSS declaration')
        }
        if (!entries.length) {
          remove()
          return
        }
        if (!rule) {
          sheet = sheetFor(document)
          const selector = rootAccent ? ':root[data-accent="custom"]' : `.${className}.${className}`
          const index = sheet.insertRule(selector + ' {}', sheet.cssRules.length)
          rule = sheet.cssRules[index] as CSSStyleRule
        }
        for (const name of Array.from(rule.style))
          if (!(name in declarations)) rule.style.removeProperty(name)
        for (const [name, value] of entries) rule.style.setProperty(name, value)
      },
    }
  }, [className, rootAccent])
  useInsertionEffect(() => () => controller.remove(), [controller])
  return controller
}

/** Install class-scoped dynamic declarations before layout/paint; release on unmount. */
export function useRuntimeStyles(declarations: RuntimeStyles) {
  const rule = useRuntimeRule()
  useInsertionEffect(() => {
    rule.update(declarations)
  })
  return rule.className
}
