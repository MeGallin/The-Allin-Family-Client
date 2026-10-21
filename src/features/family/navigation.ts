import { CalendarDays, House, Images, ListChecks } from 'lucide-react'

export const familyNavigation = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/lists', label: 'Lists', icon: ListChecks },
]
