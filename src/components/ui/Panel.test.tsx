import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from './Panel'

describe('shared panel', () => {
  it('uses the shared surface and connects its accessible heading', () => {
    render(<Panel title="Family plans">Upcoming events</Panel>)
    const panel = screen.getByRole('region', { name: 'Family plans' })
    expect(panel.classList.contains('content-surface')).toBe(true)
    expect(panel.getAttribute('aria-labelledby')).toBe(screen.getByRole('heading').id)
    expect(panel.textContent).toContain('Upcoming events')
  })

  it('supports a plain inner panel without duplicating the outer surface', () => {
    render(
      <Panel
        title="Days ahead"
        variant="plain"
        className="week-planner"
        action={<a href="/calendar">Calendar</a>}
      >
        Calendar tiles
      </Panel>,
    )
    const panel = screen.getByRole('region', { name: 'Days ahead' })
    expect(panel.classList.contains('content-surface')).toBe(false)
    expect(panel.classList.contains('week-planner')).toBe(true)
    expect(screen.getByRole('link', { name: 'Calendar' }).getAttribute('href')).toBe('/calendar')
  })
})
