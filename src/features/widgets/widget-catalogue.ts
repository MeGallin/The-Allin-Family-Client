import type { FamilyWidget } from './types'
import { builtinWidgets } from './builtin-widgets'

export type WidgetStoreId =
  'shopping' | 'polls' | 'dinner' | 'sudoku' | 'focus' | 'word' | 'countdown'
export type WidgetStoreApp = {
  id: WidgetStoreId
  title: string
  subtitle: string
  category: 'family' | 'games' | 'tools'
  availability: 'installed' | 'available' | 'proposed'
  description: string
  previews: readonly [string, string]
}

/** Catalogue metadata only; installations and family content remain in their existing sources. */
export const widgetCatalogue: readonly WidgetStoreApp[] = [
  {
    id: 'shopping',
    title: builtinWidgets[0].title,
    subtitle: 'One family. One shopping list.',
    category: 'family',
    availability: 'installed',
    description: builtinWidgets[0].description,
    previews: ['The essentials, together.', 'One list for the whole family.'],
  },
  {
    id: 'polls',
    title: builtinWidgets[1].title,
    subtitle: 'A voice for everyone.',
    category: 'family',
    availability: 'installed',
    description: builtinWidgets[1].description,
    previews: ['Small decisions. Every voice.', 'Make a choice together.'],
  },
  {
    id: 'dinner',
    title: 'Dinner Spinner',
    subtitle: 'A fresh spin on tonight.',
    category: 'family',
    availability: 'available',
    description:
      'Find inspiration with a spin. Try ideas privately, then share a dinner choice with your family when you are ready. Each installation has its own meals and visibility.',
    previews: ['A little inspiration for tonight.', 'Your next dinner starts here.'],
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    subtitle: 'A little room to think.',
    category: 'games',
    availability: 'proposed',
    description: 'An idea for a future number puzzle widget. Not available to install or use.',
    previews: ['Nine squares. A fresh challenge.', 'A puzzle at your pace.'],
  },
  {
    id: 'focus',
    title: 'Focus Timer',
    subtitle: 'Time for one thing.',
    category: 'tools',
    availability: 'proposed',
    description: 'An idea for a future focus timer. Not available to install or use.',
    previews: ['Make a little space.', 'One thing at a time.'],
  },
  {
    id: 'word',
    title: 'Daily Word',
    subtitle: 'Find your next word.',
    category: 'games',
    availability: 'proposed',
    description: 'An idea for a future word challenge. Not available to install or use.',
    previews: ['A little word play.', 'Something to puzzle over.'],
  },
  {
    id: 'countdown',
    title: 'Countdowns',
    subtitle: 'Good things are coming.',
    category: 'tools',
    availability: 'proposed',
    description:
      'An idea for a future dates and countdown widget. Not available to install or use.',
    previews: ['Keep the good dates close.', 'Something to look forward to.'],
  },
]

export function widgetInstallationPath(widget: FamilyWidget) {
  const params = new URLSearchParams({
    view: widget.visibility === 'family' ? 'family' : 'widgets',
  })
  params.set('widget', widget.id)
  return '/my-space?' + params.toString()
}
