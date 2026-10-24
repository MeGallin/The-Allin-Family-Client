import { ListChecks, Vote } from 'lucide-react'

/** These existing family tools are always installed and keep their original data sources. */
export const builtinWidgets = [
  {
    id: 'shopping',
    title: 'Shopping List',
    description: 'One shared list for everyone’s essentials, with your existing items and history.',
    icon: ListChecks,
    legacyPath: '/lists',
  },
  {
    id: 'polls',
    title: 'Polls',
    description: 'Shared questions, one vote each, and results everyone can see.',
    icon: Vote,
    legacyPath: '/polls',
  },
] as const
export type BuiltinWidget = (typeof builtinWidgets)[number]
export type BuiltinWidgetId = BuiltinWidget['id']

export function builtinWidgetPath(id: BuiltinWidgetId, search = '', hash = '') {
  const params = new URLSearchParams(search)
  params.set('view', 'family')
  params.set('tool', id)
  return '/my-space?' + params.toString() + hash
}

export function activeBuiltinWidget(params: URLSearchParams) {
  if (params.get('view') !== 'family') return undefined
  if (params.has('tool')) return builtinWidgets.find((widget) => widget.id === params.get('tool'))
  // Existing spinner editor/bookmark URLs remain spinner routes even without a selected ID.
  if (
    params.has('widget') ||
    params.get('compose') === 'spinner' ||
    ['edit', 'remove', 'removeMeal'].some((key) => params.has(key))
  )
    return undefined
  return builtinWidgets[0]
}
