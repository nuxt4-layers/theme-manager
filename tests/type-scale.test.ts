import { describe, expect, it } from 'vitest'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'
import { isUnitless, roleSize, roleValues, typeRoles, typeSizes } from '../shared/type-scale'

const sizes = () => structuredClone(createCanonicalThemeDefinition().presentation.typography.sizes) as Record<string, string>

describe('type scale', () => {
  it('separates the nine sizes from the five roles', () => {
    expect(typeSizes(sizes())).toEqual(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'])
    expect(typeRoles(sizes())).toEqual(['body', 'label', 'caption', 'heading', 'title'])
  })

  it('gives every size and role its line-height partner', () => {
    const all = sizes()
    for (const key of [...typeSizes(all), ...typeRoles(all)]) expect(all, key).toHaveProperty(`${key}-line-height`)
  })

  it('reads which size a role follows', () => {
    expect(roleSize(sizes(), 'body')).toBe('base')
    expect(roleSize(sizes(), 'title')).toBe('3xl')
    expect(roleSize(sizes(), 'base')).toBeNull()
  })

  it('moves a role and its line height together', () => {
    expect(roleValues('heading', 'xl')).toEqual({
      heading: 'var(--ui-text-xl)',
      'heading-line-height': 'var(--ui-text-xl-line-height)',
    })
  })

  it('tells a unitless line height from a length', () => {
    expect(isUnitless('1.1')).toBe(true)
    expect(isUnitless('1.5rem')).toBe(false)
  })
})
