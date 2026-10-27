import type { FamilyWidget } from './types'
import { builtinWidgets } from './builtin-widgets'

export type WidgetStoreId =
  'jobs' | 'shopping' | 'polls' | 'dinner' | 'sudoku' | 'focus' | 'word' | 'countdown'
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
    id: 'jobs',
    title: 'Household Jobs',
    subtitle: 'A little care, shared.',
    category: 'family',
    availability: 'installed',
    description:
      'Keep family responsibilities together, or use Mine for jobs only you can see. Claim, assign and complete one-off or repeating jobs. Optional target days are a guide, never a deadline. Everyone shares one family order.',
    previews: ['What needs a little care?', 'A calm place for everyday jobs.'],
  },
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
    availability: 'available',
    description:
      'One personal Sudoku installation per account. Play unique 9×9 puzzles with three starting levels, pencil marks and saved progress in My widgets. Your game is never shared with Family widgets.',
    previews: ['Nine squares. A fresh challenge.', 'A puzzle at your pace.'],
  },
  {
    id: 'focus',
    title: 'Focus Timer',
    subtitle: 'Time for one thing.',
    category: 'tools',
    availability: 'available',
    description:
      'A personal focus and break timer with private session history, saved across your devices. Choose your duration and start each phase yourself. Timed minutes do not measure attention.',
    previews: ['Make a little space.', 'One thing at a time.'],
  },
  {
    id: 'word',
    title: 'Daily Word',
    subtitle: 'Find your next word.',
    category: 'games',
    availability: 'available',
    description:
      'One shared five-letter word each London day, six valid guesses and private saved progress. Share a finished result with family only when you choose. Removing and reinstalling keeps today’s attempts.',
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
