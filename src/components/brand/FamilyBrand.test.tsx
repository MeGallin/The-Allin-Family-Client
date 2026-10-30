import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FamilyBrand } from './FamilyBrand'
import { FamilyFooter } from './FamilyFooter'

describe('family branding', () => {
  it.each(['small', 'medium', 'large'] as const)('supports the shared %s size', (size) => {
    render(<FamilyBrand size={size} />)
    const brand = screen.getByRole('img', { name: 'The Allin Family' })
    expect(brand.classList.contains(`family-logo--${size}`)).toBe(true)
    expect(brand.querySelector('svg')?.getAttribute('viewBox')).toBe('25 21 150 165')
    expect(brand.querySelectorAll('[stroke]')).toHaveLength(0)
    expect(brand.querySelector('.family-logo__letters')?.getAttribute('viewBox')).toBe(
      '-40 21 200 165',
    )
    expect(brand.querySelectorAll('.family-logo__letters path')).toHaveLength(4)
    const dot = brand.querySelector('.family-logo__letters rect')
    expect(dot?.getAttribute('fill')).toBe('var(--color-text-on-dark)')
    expect(dot?.getAttribute('x')).toBe('52.9')
    expect(dot?.getAttribute('y')).toBe('88')
    expect(dot?.getAttribute('width')).toBe('14')
    expect(dot?.getAttribute('height')).toBe('14')
    expect(brand.querySelector('.family-logo__the')?.textContent).toBe('The')
    expect(brand.querySelector('.family-logo__family')?.textContent).toBe('Family')
    expect(brand.textContent).toBe('TheFamily')
  })

  it('gives the standalone mark via the retained shield variant the complete accessible family name', () => {
    render(<FamilyBrand variant="shield" />)
    const brand = screen.getByRole('img', { name: 'The Allin Family' })
    expect(brand.textContent).toBe('')
    expect(brand.querySelector('.family-logo__letters')).toBeNull()
    expect(brand.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('keeps the signed-out footer free of repeated branding', () => {
    render(<FamilyFooter showBrand={false} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('A private space for the people who matter.')).toBeTruthy()
  })
})
