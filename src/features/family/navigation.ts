import { CalendarDays, Grid2X2, House, Images, NotebookPen } from 'lucide-react'

export const familyNavigation = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/notes', label: 'Personal notes', mobileLabel: 'Notes', icon: NotebookPen },
  { to: '/my-space', label: 'Widgets', icon: Grid2X2 },
]
