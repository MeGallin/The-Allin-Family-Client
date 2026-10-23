import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TriangleAlert } from 'lucide-react'
import { IndicatorStrip, type CalendarIndicator } from './IndicatorStrip'

function Detail({ name }: { name: string }) {
  return <p>Details for {name}</p>
}
const indicators: CalendarIndicator[] = Array.from({ length: 8 }, (_, index) => ({
  id: 'service-' + index,
  label: 'Service ' + index,
  accessibleLabel: 'Open service ' + index,
  description: 'Notice ' + index,
  source: 'Provider ' + index,
  icon: TriangleAlert,
  tone: 'accent',
  priority: index,
  dialogTitle: 'Service details ' + index,
  details: () => <Detail name={'service ' + index} />,
}))

describe('IndicatorStrip', () => {
  it('shows two groups and counts all remaining groups without mutating props', () => {
    const input = [...indicators].reverse()
    render(<IndicatorStrip indicators={input} dayLabel="Friday" />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByText('+6 more')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open service 0' })).toBeTruthy()
    expect(input[0].id).toBe('service-7')
    expect(screen.queryByText('Details for service 0')).toBeNull()
  })
  it('opens all groups with exclusive lazy details and restores focus on close', () => {
    const view = render(<IndicatorStrip indicators={indicators} dayLabel="Friday" />)
    const more = screen.getByText('+6 more')
    more.focus()
    fireEvent.click(more)
    expect(screen.getByRole('dialog', { name: 'Indicators · Friday' })).toBeTruthy()
    expect(view.container.querySelectorAll('summary')).toHaveLength(8)
    expect(screen.queryByText('Details for service 0')).toBeNull()
    fireEvent.click(screen.getByText('Notice 0'))
    expect(screen.getByText('Details for service 0')).toBeTruthy()
    fireEvent.click(screen.getByText('Notice 7'))
    expect(screen.queryByText('Details for service 0')).toBeNull()
    expect(screen.getByText('Details for service 7')).toBeTruthy()
    expect(view.container.querySelectorAll('details[open]')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(document.activeElement).toBe(more)
  })
  it('opens a direct detail and handles its removal while open', () => {
    const view = render(<IndicatorStrip indicators={indicators.slice(0, 1)} dayLabel="Friday" />)
    expect(screen.queryByText(/more/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open service 0' }))
    expect(screen.getByRole('dialog', { name: 'Service details 0' })).toBeTruthy()
    expect(screen.getByText('Details for service 0')).toBeTruthy()
    view.rerender(<IndicatorStrip indicators={[]} dayLabel="Friday" />)
    expect(screen.getByText(/no longer available/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
