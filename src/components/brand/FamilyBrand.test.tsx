import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FamilyBrand } from './FamilyBrand'
import { FamilyFooter } from './FamilyFooter'
import shieldUrl from '../../../favicon.svg'

describe('family branding', () => {
  it.each(['small', 'medium', 'large'] as const)('supports the shared %s size', (size) => {
    render(<FamilyBrand size={size} />)
    const brand = screen.getByRole('img', { name: 'The Allin Family' })
    expect(brand.classList.contains(`family-logo--${size}`)).toBe(true)
    expect(brand.querySelector('img')?.getAttribute('src')).toBe(shieldUrl)
    expect(brand.textContent).toBe('llin Family')
  })

  it('gives the shield-only variant the complete accessible family name', () => {
    render(<FamilyBrand variant="shield" />)
    const brand = screen.getByRole('img', { name: 'The Allin Family' })
    expect(brand.textContent).toBe('')
    expect(brand.querySelector('img')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('keeps the signed-out footer free of repeated branding', () => {
    render(<FamilyFooter showBrand={false} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('A private space for the people who matter.')).toBeTruthy()
  })
})
