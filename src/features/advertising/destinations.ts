export const advertDestinations: Readonly<
  Record<string, { path: string; label: string; service: string; shortLabel: string }>
> = {
  jobs: {
    service: 'Household Jobs',
    shortLabel: 'Open jobs',
    path: '/my-space?view=family&tool=jobs',
    label: 'Explore Household Jobs',
  },
  shopping: {
    service: 'Shopping List',
    shortLabel: 'Open list',
    path: '/my-space?view=family&tool=shopping',
    label: 'Explore Shopping List',
  },
  polls: {
    service: 'Family Polls',
    shortLabel: 'Open polls',
    path: '/my-space?view=family&tool=polls',
    label: 'Explore Polls',
  },
  dinner: {
    service: 'Dinner Spinner',
    shortLabel: 'View spinner',
    path: '/my-space?view=library&details=dinner',
    label: 'Discover Dinner Spinner',
  },
  where: {
    service: 'Where Is It?',
    shortLabel: 'View finder',
    path: '/my-space?view=library&details=where',
    label: 'Discover Where Is It?',
  },
  nonograms: {
    service: 'Nonograms',
    shortLabel: 'View game',
    path: '/my-space?view=library&details=nonograms',
    label: 'Discover Nonograms',
  },
  sudoku: {
    service: 'Sudoku',
    shortLabel: 'View game',
    path: '/my-space?view=library&details=sudoku',
    label: 'Discover Sudoku',
  },
  focus: {
    service: 'Focus Timer',
    shortLabel: 'View timer',
    path: '/my-space?view=library&details=focus',
    label: 'Discover Focus Timer',
  },
  word: {
    service: 'Daily Word',
    shortLabel: 'View game',
    path: '/my-space?view=library&details=word',
    label: 'Discover Daily Word',
  },
  calendar: {
    service: 'Family Calendar',
    shortLabel: 'Open calendar',
    path: '/calendar',
    label: 'Open Calendar',
  },
  memories: {
    service: 'Family Memories',
    shortLabel: 'Open memories',
    path: '/memories',
    label: 'Open Memories',
  },
  notes: { service: 'Notes', shortLabel: 'Open notes', path: '/notes', label: 'Open Notes' },
  appearance: {
    service: 'Your Appearance',
    shortLabel: 'Choose look',
    path: '/profile?view=appearance',
    label: 'Choose your appearance',
  },
  week: {
    service: 'Days Ahead',
    shortLabel: 'Set forecast',
    path: '/profile?view=weather',
    label: 'Choose Days Ahead preferences',
  },
  tfl: {
    service: 'Travel Preferences',
    shortLabel: 'Set travel',
    path: '/profile?view=travel',
    label: 'Choose travel preferences',
  },
}
