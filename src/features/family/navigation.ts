import {
  CalendarDays,
  House,
  Images,
  ListChecks,
  NotebookPen,
  Vote,
  TriangleAlert,
} from 'lucide-react'

export const familyNavigation = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/lists', label: 'Lists', icon: ListChecks },
  { to: '/polls', label: 'Polls', icon: Vote, desktopOnly: true },
  { to: '/alerts', label: 'Alerts', icon: TriangleAlert, desktopOnly: true },
  { to: '/notes', label: 'Personal notes', mobileLabel: 'Notes', icon: NotebookPen },
]
