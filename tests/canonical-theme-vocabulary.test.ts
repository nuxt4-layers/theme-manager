import { describe, expect, it } from 'vitest'
import {
  CANONICAL_THEME_CARDINALITY,
  assertCompleteThemeVocabulary,
  completeThemeVocabulary,
  createCanonicalThemeDefinition,
  themeVocabularyCardinality,
} from '../shared/canonical-theme'

describe('PR-14 canonical Theme vocabulary', () => {
  it('defines the complete 572-entry presentation vocabulary', () => {
    expect(CANONICAL_THEME_CARDINALITY).toEqual({
      colour: 280,
      typography: 17,
      spacing: 31,
      radii: 6,
      effects: 228,
      responsive: 10,
      total: 572,
    })
    const theme = createCanonicalThemeDefinition()
    expect(themeVocabularyCardinality(theme)).toEqual(CANONICAL_THEME_CARDINALITY)
    expect(assertCompleteThemeVocabulary(theme)).toBe(theme)
  })

  it('preserves all three colour categories in both modes', () => {
    const theme = createCanonicalThemeDefinition()
    for (const mode of ['light', 'dark']) {
      const roles = Object.keys(theme.modes[mode] as Record<string, unknown>)
      expect(roles.filter(role => role.startsWith('fill-'))).toHaveLength(14)
      expect(roles.filter(role => role.startsWith('pen-'))).toHaveLength(14)
      expect(roles.filter(role => role.startsWith('edge-'))).toHaveLength(14)
    }
  })

  it('restores missing canonical entries without overwriting supplied values', () => {
    const partial = createCanonicalThemeDefinition({ id: 'partial', name: 'Partial' })
    partial.modes.light = { 'fill-primary': { default: '#123456' } }
    partial.presentation.spacing = {}
    const completed = completeThemeVocabulary(partial)
    expect((completed.modes.light as any)['fill-primary'].default).toBe('#123456')
    expect(themeVocabularyCardinality(completed)).toEqual(CANONICAL_THEME_CARDINALITY)
  })

  it('rejects an incomplete vocabulary at the completeness gate', () => {
    const partial = createCanonicalThemeDefinition()
    partial.presentation.effects = {}
    expect(() => assertCompleteThemeVocabulary(partial)).toThrow(/effects has 0 entries/)
  })

  it('contains representative recovered values from every non-colour family', () => {
    const theme = createCanonicalThemeDefinition()
    expect(theme.presentation.typography).toHaveProperty('families.sans')
    expect(theme.presentation.typography).toHaveProperty('sizes.4xl')
    expect(theme.presentation.typography).toHaveProperty('weights.heavy')
    expect(theme.presentation.spacing).toHaveProperty('p-xs')
    expect(theme.presentation.radii).toHaveProperty('full')
    expect(theme.presentation.effects).toHaveProperty('shadow.md-primary')
    expect(theme.presentation.effects).toHaveProperty('insetShadow.xl-notification')
    expect(theme.presentation.effects).toHaveProperty('dropShadow.lg-success')
    expect(theme.presentation.effects).toHaveProperty('textShadow.sm-base')
    expect(theme.presentation.responsive).toHaveProperty('breakpoints.5xl')
    expect(theme.presentation.responsive).toHaveProperty('containers.2xl')
  })
})
