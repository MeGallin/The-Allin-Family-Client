import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DinnerWheel } from './DinnerWheel'
describe('Wheel display safeguards', () => {
  it('renders arbitrary long names as plain text and tolerates missing SVG measurement APIs', () => {
    const title = '<img src=x onerror=alert(1)>'
    const { container } = render(<DinnerWheel meals={[{ title }, { title: '😀'.repeat(80) }]} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('2 equally likely')
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain(title)
  })
  it('renders an empty legacy wheel safely', () => {
    render(<DinnerWheel meals={[]} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain(
      'no meal choices available',
    )
  })
})
