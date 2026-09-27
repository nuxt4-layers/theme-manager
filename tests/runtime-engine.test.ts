import { describe, expect, it } from 'vitest'
import {
  assertRuntimeTheme,
  createThemeApplication,
  legacyColourThemeToRuntime,
  runtimeVariableName,
  type RuntimeTheme,
  type ThemeStyleTarget,
} from '../shared/theme-runtime'

const states = {
  default: '#000001',
  hover: '#000002',
  active: '#000003',
  selected: '#000004',
  visited: '#000005',
  disabled: '#000006',
}

const theme = (id = 'theme-a'): RuntimeTheme => ({
  id,
  name: id,
  modes: {
    light: { 'fill-base': { ...states, shadow: '#000007' } },
    dark: { 'fill-base': { ...states, shadow: '#000008' } },
  },
})

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

describe('TM-5 runtime application engine', () => {
  it('uses the recovered raw variable naming contract', () => {
    expect(runtimeVariableName('fill-base', 'default', 'light'))
      .toBe('--ui-fill-base-default-light')
  })

  it('applies both modes and all supplied states through one engine', () => {
    const { style, values } = target()
    const application = createThemeApplication(style)
    application.apply(theme())

    expect(values.size).toBe(14)
    expect(values.get('--ui-fill-base-default-light')).toBe('#000001')
    expect(values.get('--ui-fill-base-shadow-dark')).toBe('#000008')
    expect(application.appliedVariables).toHaveLength(14)
  })

  it('clears every previous override before applying a replacement', () => {
    const { style, values } = target()
    const application = createThemeApplication(style)
    application.apply(theme('first'))
    application.apply({
      id: 'second',
      name: 'second',
      modes: {
        light: { 'pen-base': { ...states } },
        dark: { 'pen-base': { ...states } },
      },
    })

    expect(values.has('--ui-fill-base-default-light')).toBe(false)
    expect(values.get('--ui-pen-base-default-light')).toBe('#000001')
  })

  it('clears all runtime overrides to expose bundled CSS fallback', () => {
    const { style, values } = target()
    const application = createThemeApplication(style)
    application.apply(theme())
    application.clear()
    expect(values.size).toBe(0)
    expect(application.appliedVariables).toEqual([])
  })

  it('rejects incomplete recovered interaction-state definitions', () => {
    const invalid = theme()
    delete invalid.modes.light['fill-base']!.disabled
    expect(() => assertRuntimeTheme(invalid)).toThrow(/disabled/)
  })

  it('adapts recovered legacy colour payloads without changing semantics', () => {
    const runtime = legacyColourThemeToRuntime({
      id: 'legacy',
      name: 'Legacy',
      colors: {
        light: { 'fill-base': { ...states } },
        dark: { 'fill-base': { ...states } },
      },
    })
    expect(runtime.id).toBe('legacy')
    expect(runtime.modes.light['fill-base']?.hover).toBe('#000002')
  })

  it('rejects unsafe CSS variable path segments', () => {
    expect(() => runtimeVariableName('fill;base', 'default', 'light')).toThrow()
  })
})
