import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CANONICAL_THEME_CARDINALITY, createCanonicalThemeDefinition } from '../shared/canonical-theme'
import { THEME_TOKEN_CATALOGUE, createThemeTokenCatalogue, themeTokenValue } from '../shared/theme-token-catalogue'
import { runtimePresentationVariables, runtimeVariableName, themeDefinitionToRuntime } from '../shared/theme-runtime'

const root = resolve(import.meta.dirname, '..')
const defaultCss = readFileSync(resolve(root, 'assets/css/theme/theme-default.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const declared = new Set([...defaultCss.matchAll(/(--ui-[\w-]+)\s*:/g)].map(([, name]) => name))

describe('theme token catalogue', () => {
  const theme = createCanonicalThemeDefinition()

  it('describes every canonical entry exactly once', () => {
    expect(THEME_TOKEN_CATALOGUE).toHaveLength(CANONICAL_THEME_CARDINALITY.colour * 2 + CANONICAL_THEME_CARDINALITY.total - CANONICAL_THEME_CARDINALITY.colour)
    expect(new Set(THEME_TOKEN_CATALOGUE.map(token => token.variable)).size).toBe(THEME_TOKEN_CATALOGUE.length)
    expect(new Set(THEME_TOKEN_CATALOGUE.map(token => token.path.join('.'))).size).toBe(THEME_TOKEN_CATALOGUE.length)
  })

  it('names exactly the variables the runtime engine writes', () => {
    const runtime = themeDefinitionToRuntime(theme)
    const engine = new Set([
      ...Object.entries(runtime.modes).flatMap(([mode, roles]) =>
        Object.entries(roles).flatMap(([role, states]) =>
          Object.keys(states).map(state => runtimeVariableName(role, state, mode as 'light' | 'dark')))),
      ...runtimePresentationVariables(runtime.presentation!).map(([name]) => name),
    ])
    expect(new Set(THEME_TOKEN_CATALOGUE.map(token => token.variable))).toEqual(engine)
  })

  it('names only variables theme-default.css declares, and every one of them but the base spacing unit', () => {
    expect(THEME_TOKEN_CATALOGUE.filter(token => !declared.has(token.variable))).toEqual([])
    const catalogued = new Set(THEME_TOKEN_CATALOGUE.map(token => token.variable))
    expect([...declared].filter(name => !catalogued.has(name))).toEqual(['--ui-spacing'])
  })

  it('reads each value back from its path', () => {
    for (const token of THEME_TOKEN_CATALOGUE) expect(themeTokenValue(theme, token), token.path.join('.')).toBeTypeOf('string')
  })

  it('assigns kinds that match the values', () => {
    const value = (token: (typeof THEME_TOKEN_CATALOGUE)[number]) => themeTokenValue(theme, token)!
    const ofKind = (kind: string) => THEME_TOKEN_CATALOGUE.filter(token => token.kind === kind)

    expect(ofKind('colour').every(token => /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value(token)))).toBe(true)
    expect(ofKind('colour')).toHaveLength(980)
    expect(ofKind('reference').every(token => value(token) === `var(${token.references})` && declared.has(token.references!))).toBe(true)
    expect(ofKind('shadow').every(token => /\d+px/.test(value(token)))).toBe(true)
    expect(ofKind('shadow')).toHaveLength(560)
    expect(ofKind('easing').every(token => /^(?:cubic-bezier\(|linear|ease)/.test(value(token)))).toBe(true)
    expect(ofKind('duration').every(token => /^\d+(?:\.\d+)?m?s$/.test(value(token)))).toBe(true)
    expect(ofKind('animation').every(token => /^[a-z-]+ \S+/.test(value(token)))).toBe(true)
    expect(ofKind('ratio').every(token => /^\d+ \/ \d+$/.test(value(token)))).toBe(true)
    expect(ofKind('angle').every(token => /deg$/.test(value(token)))).toBe(true)
    expect(ofKind('font-weight').every(token => /^\d{3}$/.test(value(token)))).toBe(true)
    expect(ofKind('number').every(token => /^\d+(?:\.\d+)?$/.test(value(token)))).toBe(true)
    expect(ofKind('length').every(token => /^(?:-?\d*\.?\d+(?:px|rem|em|%)|0|calc\(.+\))$/.test(value(token)))).toBe(true)
  })

  it('places the elevation roles, defaults and shared shapes in the shadows section', () => {
    const shadow = (key: string) => THEME_TOKEN_CATALOGUE.find(token => token.path.join('.') === `presentation.effects.shadow.${key}`)!
    expect(shadow('raised-light')).toMatchObject({ section: 'shadows', kind: 'reference', references: '--ui-shadow-sm-light', mode: 'light' })
    expect(shadow('sm-accent-dark')).toMatchObject({ section: 'shadows', kind: 'shadow', mode: 'dark', variable: '--ui-shadow-sm-accent-dark' })
  })

  it('marks breakpoints as not editable, because media queries are compiled', () => {
    const breakpoints = THEME_TOKEN_CATALOGUE.filter(token => token.section === 'breakpoints')
    expect(breakpoints).toHaveLength(7)
    expect(breakpoints.every(token => !token.editable)).toBe(true)
    expect(THEME_TOKEN_CATALOGUE.filter(token => !token.editable)).toEqual(breakpoints)
  })

  it('writes the bare names for the radius and border-width defaults', () => {
    const variable = (path: string) => THEME_TOKEN_CATALOGUE.find(token => token.path.join('.') === path)?.variable
    expect(variable('presentation.radii.DEFAULT')).toBe('--ui-radius')
    expect(variable('presentation.borders.widths.DEFAULT')).toBe('--ui-border-width')
    expect(variable('presentation.borders.focusRing.offset')).toBe('--ui-focus-ring-offset')
  })

  it('describes colours by channel, role, state and mode', () => {
    expect(THEME_TOKEN_CATALOGUE.find(token => token.variable === '--ui-edge-accent-focus-light')).toMatchObject({
      path: ['modes', 'light', 'edge-accent', 'focus'], section: 'colours', group: 'edge', role: 'accent', state: 'focus', mode: 'light',
    })
  })

  it('catalogues only the groups a stored theme actually has', () => {
    const partial = createCanonicalThemeDefinition()
    delete (partial.presentation as { motion?: unknown }).motion
    const tokens = createThemeTokenCatalogue(partial)
    expect(tokens.some(token => token.section === 'motion')).toBe(false)
    expect(tokens).toHaveLength(THEME_TOKEN_CATALOGUE.length - 22)
  })
})
