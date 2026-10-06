import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('Theme Definition to runtime integration', () => {
  it('preserves the complete canonical presentation through conversion', () => {
    const definition = createCanonicalThemeDefinition()
    const runtime = themeDefinitionToRuntime(definition)
    const variables = runtimePresentationVariables(runtime.presentation!)

    // Every non-colour --ui-* token in theme-default.css except the base spacing unit.
    expect(variables).toHaveLength(750)
    expect(new Set(variables.map(([name]) => name))).toHaveLength(750)
  })

  it('maps every canonical presentation variable through default and API CSS, with runtime-safe Tailwind indirection', () => {
    const runtime = themeDefinitionToRuntime(createCanonicalThemeDefinition())
    const names = runtimePresentationVariables(runtime.presentation!).map(([name]) => name)
    const defaultCss = read('assets/css/theme/theme-default.css')
    const apiCss = read('assets/css/theme/theme-api.css')
    const tailwindCss = read('assets/css/tailwindcss/tailwind-config.css')

    for (const uiName of names) {
      // Mode-suffixed tokens (shadows) map to one --api-* name selected per mode.
      const suffix = uiName.slice('--ui-'.length).replace(/-(?:light|dark)$/, '')
      const apiName = `--api-${suffix}`
      expect(defaultCss, `missing default declaration for ${uiName}`).toContain(`${uiName}:`)
      expect(apiCss, `missing API mapping for ${apiName}`).toContain(`${apiName}: var(${uiName})`)

      // Breakpoints are literal in Tailwind; tilt and durations have no Tailwind
      // namespace and are used as arbitrary values. Everything else reaches a utility.
      if (!/^(?:breakpoint|tilt|duration)-/.test(suffix)) {
        expect(tailwindCss, `missing Tailwind API indirection for ${suffix}`)
          .toMatch(new RegExp(`--[\\w-]+: var\\(${apiName}\\);`))
      }
    }
  })

  it('carries distinctive values from every non-colour family into runtime CSS variables', () => {
    const definition = createCanonicalThemeDefinition({
      id: 'integration-theme',
      name: 'Integration Theme',
    })

    definition.presentation.typography.families.sans = 'Integration Sans, sans-serif'
    definition.presentation.typography.sizes.base = '21px'
    definition.presentation.typography.weights.bold = '725'
    definition.presentation.spacing['step-md'] = '19px'
    definition.presentation.radii.xl = '13px'
    definition.presentation.effects.shadow['md-primary-light'] = '0 7px 11px rgb(1 2 3 / 0.4)'
    definition.presentation.effects.insetShadow['sm-base-dark'] = 'inset 0 3px 5px #010203'
    definition.presentation.effects.dropShadow['lg-success-light'] = '0 9px 13px #040506'
    definition.presentation.effects.textShadow['sm-base-light'] = '1px 2px 3px #070809'
    definition.presentation.responsive.breakpoints.md = '801px'
    definition.presentation.responsive.containers['2xl'] = '1601px'
    const presentation = definition.presentation as unknown as Record<string, Record<string, Record<string, string>>>
    presentation.borders!.widths!.lg = '5px'
    presentation.motion!.ease!.standard = 'cubic-bezier(0.1, 0, 0, 1)'

    const runtime = themeDefinitionToRuntime(definition)
    const { style, values } = target()
    createThemeApplication(style).apply(runtime)

    expect(values.get('--ui-font-sans')).toBe('Integration Sans, sans-serif')
    expect(values.get('--ui-text-base')).toBe('21px')
    expect(values.get('--ui-font-weight-bold')).toBe('725')
    expect(values.get('--ui-spacing-step-md')).toBe('19px')
    expect(values.get('--ui-radius-xl')).toBe('13px')
    expect(values.get('--ui-shadow-md-primary-light')).toBe('0 7px 11px rgb(1 2 3 / 0.4)')
    expect(values.get('--ui-inset-shadow-sm-base-dark')).toBe('inset 0 3px 5px #010203')
    expect(values.get('--ui-drop-shadow-lg-success-light')).toBe('0 9px 13px #040506')
    expect(values.get('--ui-text-shadow-sm-base-light')).toBe('1px 2px 3px #070809')
    expect(values.get('--ui-border-width-lg')).toBe('5px')
    expect(values.get('--ui-ease-standard')).toBe('cubic-bezier(0.1, 0, 0, 1)')
    expect(values.get('--ui-breakpoint-md')).toBe('801px')
    expect(values.get('--ui-container-2xl')).toBe('1601px')
  })

  it('applies the complete canonical Theme rather than colour-only runtime state', () => {
    const definition = createCanonicalThemeDefinition()
    const runtime = themeDefinitionToRuntime(definition)
    const { style, values } = target()
    const application = createThemeApplication(style)

    application.apply(runtime)

    // 980 light/dark colour variables + 750 non-colour presentation variables.
    expect(values.size).toBe(1730)
    expect(application.appliedVariables).toHaveLength(1730)
    expect(values.get('--ui-fill-primary-default-light')).toBe(
      definition.modes.light['fill-primary']!.default,
    )
    expect(values.get('--ui-radius-xl')).toBe(definition.presentation.radii.xl)
    expect(values.get('--ui-spacing-step-md')).toBe(definition.presentation.spacing['step-md'])
    expect(values.get('--ui-font-weight-bold')).toBe(
      definition.presentation.typography.weights.bold,
    )
  })

  it('clears all selected Theme overrides so bundled CSS can become authoritative again', () => {
    const runtime = themeDefinitionToRuntime(createCanonicalThemeDefinition())
    const { style, values } = target()
    const application = createThemeApplication(style)

    application.apply(runtime)
    expect(values.size).toBe(1730)

    application.clear()
    expect(values.size).toBe(0)
    expect(application.appliedVariables).toEqual([])
  })
})
