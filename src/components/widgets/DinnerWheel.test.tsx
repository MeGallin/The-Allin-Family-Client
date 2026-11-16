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
  it('updates wheel rotation and retains the palette through a scoped stylesheet rule', () => {
    const meals = [{ title: 'Soup' }, { title: 'Pasta' }]
    const view = render(<DinnerWheel meals={meals} rotation={0} />)
    const disc = view.container.querySelector('.dinner-wheel__disc')!
    const selector = Array.from(disc.classList).find((name) => name.startsWith('nimbus-runtime-'))!
    const rule = (document.adoptedStyleSheets ?? [])
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .find((rule) => (rule as CSSStyleRule).selectorText.includes(selector)) as CSSStyleRule
    expect(disc.hasAttribute('style')).toBe(false)
    expect(rule.style.getPropertyValue('background')).toContain('--wheel-tone-1')
    expect(rule.style.getPropertyValue('transform')).toBe('rotate(0deg)')
    view.rerender(<DinnerWheel meals={meals} rotation={1080} />)
    expect(rule.style.getPropertyValue('transform')).toBe('rotate(1080deg)')
    expect(rule.style.getPropertyValue('background')).toContain('--wheel-tone-2')
  })
})
