import { describe, expect, it } from 'vitest'
import { THEME_TOKEN_CATALOGUE } from '../shared/theme-token-catalogue'
import { apiName, referenceOptions, tokenKey } from '../shared/token-references'

const group = (id: string) => THEME_TOKEN_CATALOGUE.filter(token => token.group === id)
const token = (path: string) => THEME_TOKEN_CATALOGUE.find(candidate => candidate.path.join('.') === path)!

describe('token references', () => {
  it('offers a radius role every radius size it may follow', () => {
    const options = referenceOptions(token('presentation.radii.card'), group('radii'))!
    expect(options.map(option => option.label)).toEqual(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'])
    expect(options).toContainEqual({ label: 'lg', value: 'var(--ui-radius-lg)' })
  })

  it('offers the default radius the same sizes', () => {
    expect(referenceOptions(token('presentation.radii.DEFAULT'), group('radii'))).toHaveLength(9)
  })

  it('shows, rather than offers, a reference into another scale', () => {
    expect(referenceOptions(token('presentation.responsive.containers.screen-md'), group('containers'))).toBeNull()
  })

  it('offers nothing for a value that is not a reference', () => {
    expect(referenceOptions(token('presentation.radii.md'), group('radii'))).toBeNull()
  })

  it('names the --api-* variable and the key of a token', () => {
    expect(apiName('--ui-radius-card')).toBe('--api-radius-card')
    expect(apiName('--ui-border-width')).toBe('--api-border-width')
    expect(tokenKey(token('presentation.borders.widths.DEFAULT'))).toBe('DEFAULT')
  })
})
