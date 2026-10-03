import { describe, expect, it } from 'vitest'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'
import {
  createThemeApplication,
  runtimePresentationVariables,
  themeDefinitionToRuntime,
  type ThemeStyleTarget,
} from '../shared/theme-runtime'

function target() {
  const values = new Map<string, string>()
  const style: ThemeStyleTarget = {
    setProperty(name, value) { values.set(name, value) },
    removeProperty(name) {
      const old = values.get(name) ?? ''
      values.delete(name)
      return old
    },
  }
  return { style, values }
}

describe('Theme Definition to runtime integration', () => {
  it('preserves the complete canonical presentation through conversion', () => {
    const definition = createCanonicalThemeDefinition()
    const runtime = themeDefinitionToRuntime(definition)
    const variables = runtimePresentationVariables(runtime.presentation!)

    expect(variables).toHaveLength(292)
    expect(new Set(variables.map(([name]) => name))).toHaveLength(292)
  })

  it('carries distinctive values from every non-colour family into runtime CSS variables', () => {
    const definition = createCanonicalThemeDefinition({
      id: 'integration-theme',
      name: 'Integration Theme',
    })

    definition.presentation.typography.families.sans = 'Integration Sans, sans-serif'
    definition.presentation.typography.sizes.base = '21px'
    definition.presentation.typography.weights.bold = '725'
    definition.presentation.spacing['4'] = '19px'
    definition.presentation.radii.xl = '13px'
    definition.presentation.effects.shadow['md-primary'] = '0 7px 11px rgb(1 2 3 / 0.4)'
    definition.presentation.effects.insetShadow.sm = 'inset 0 3px 5px #010203'
    definition.presentation.effects.dropShadow['lg-success'] = '0 9px 13px #040506'
    definition.presentation.effects.textShadow['sm-base'] = '1px 2px 3px #070809'
    definition.presentation.responsive.breakpoints.md = '801px'
    definition.presentation.responsive.containers['2xl'] = '1601px'

    const runtime = themeDefinitionToRuntime(definition)
    const { style, values } = target()
    createThemeApplication(style).apply(runtime)

    expect(values.get('--ui-font-sans')).toBe('Integration Sans, sans-serif')
    expect(values.get('--ui-text-base')).toBe('21px')
    expect(values.get('--ui-font-weight-bold')).toBe('725')
    expect(values.get('--ui-spacing-4')).toBe('19px')
    expect(values.get('--ui-radius-xl')).toBe('13px')
    expect(values.get('--ui-shadow-md-primary')).toBe('0 7px 11px rgb(1 2 3 / 0.4)')
    expect(values.get('--ui-inset-shadow-sm')).toBe('inset 0 3px 5px #010203')
    expect(values.get('--ui-drop-shadow-lg-success')).toBe('0 9px 13px #040506')
    expect(values.get('--ui-text-shadow-sm-base')).toBe('1px 2px 3px #070809')
    expect(values.get('--ui-breakpoint-md')).toBe('801px')
    expect(values.get('--ui-container-2xl')).toBe('1601px')
  })

  it('applies the complete canonical Theme rather than colour-only runtime state', () => {
    const definition = createCanonicalThemeDefinition()
    const runtime = themeDefinitionToRuntime(definition)
    const { style, values } = target()
    const application = createThemeApplication(style)

    application.apply(runtime)

    // 560 light/dark colour variables + 292 non-colour presentation variables.
    expect(values.size).toBe(852)
    expect(application.appliedVariables).toHaveLength(852)
    expect(values.get('--ui-fill-primary-default-light')).toBe(
      definition.modes.light['fill-primary']!.default,
    )
    expect(values.get('--ui-radius-xl')).toBe(definition.presentation.radii.xl)
    expect(values.get('--ui-spacing-4')).toBe(definition.presentation.spacing['4'])
    expect(values.get('--ui-font-weight-bold')).toBe(
      definition.presentation.typography.weights.bold,
    )
  })

  it('clears all selected Theme overrides so bundled CSS can become authoritative again', () => {
    const runtime = themeDefinitionToRuntime(createCanonicalThemeDefinition())
    const { style, values } = target()
    const application = createThemeApplication(style)

    application.apply(runtime)
    expect(values.size).toBe(852)

    application.clear()
    expect(values.size).toBe(0)
    expect(application.appliedVariables).toEqual([])
  })
})
