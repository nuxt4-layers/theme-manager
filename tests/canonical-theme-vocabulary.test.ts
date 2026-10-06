import { describe, expect, it } from 'vitest'
import {
  CANONICAL_THEME_CARDINALITY,
  assertCompleteThemeVocabulary,
  completeThemeVocabulary,
  createCanonicalThemeDefinition,
  themeVocabularyCardinality,
} from '../shared/canonical-theme'

describe('PR-14 canonical Theme vocabulary', () => {
  it('defines the complete 1240-entry presentation vocabulary', () => {
    expect(CANONICAL_THEME_CARDINALITY).toEqual({
      colour: 490,
      typography: 45,
      spacing: 9,
      radii: 16,
      effects: 626,
      responsive: 23,
      borders: 9,
      motion: 22,
      total: 1240,
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
      for (const role of roles) {
        const states = Object.keys((theme.modes[mode] as Record<string, Record<string, string>>)[role]!)
        expect(states).toHaveLength(role.startsWith('edge-') ? 11 : 12)
      }
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

  it('contains representative values from every non-colour family', () => {
    const theme = createCanonicalThemeDefinition()
    const presentation = theme.presentation as unknown as Record<string, Record<string, unknown>>
    expect(presentation.typography).toHaveProperty('families.sans')
    expect(presentation.typography).toHaveProperty('sizes.4xl')
    expect(presentation.typography).toHaveProperty('sizes.sm-line-height')
    expect(presentation.typography).toHaveProperty('weights.bold')
    expect(presentation.typography).toHaveProperty('tracking.caps')
    expect(presentation.typography).toHaveProperty('leading.snug')
    expect(presentation.spacing).toHaveProperty('step-md')
    expect(presentation.radii).toHaveProperty('full')
    expect(presentation.radii).toHaveProperty('DEFAULT')
    expect(presentation.radii).toHaveProperty('card')
    expect(presentation.effects).toHaveProperty(['shadow', 'md-primary-light'])
    expect(presentation.effects).toHaveProperty(['shadow', 'raised-light'])
    expect(presentation.effects).toHaveProperty(['insetShadow', 'xl-notification-dark'])
    expect(presentation.effects).toHaveProperty(['dropShadow', 'lg-success-light'])
    expect(presentation.effects).toHaveProperty(['textShadow', 'sm-base-dark'])
    expect(presentation.effects).toHaveProperty('blur.md')
    expect(presentation.effects).toHaveProperty('aspect.video')
    expect(presentation.responsive).toHaveProperty('breakpoints.3xl')
    expect(presentation.responsive).toHaveProperty('containers.7xl')
    expect(presentation.borders).toHaveProperty('widths.DEFAULT')
    expect(presentation.borders).toHaveProperty('focusRing.offset')
    expect(presentation.motion).toHaveProperty(['duration', 'fast-exit'])
    expect(presentation.motion).toHaveProperty(['animate', 'fade-in'])
  })

  it('carries no base spacing unit, which is not settable by design', () => {
    const theme = createCanonicalThemeDefinition()
    expect(theme.presentation.spacing).not.toHaveProperty('DEFAULT')
  })
})
