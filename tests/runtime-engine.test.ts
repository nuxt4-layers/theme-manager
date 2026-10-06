import { describe, expect, it } from 'vitest'
import {
  assertRuntimeTheme,
  createThemeApplication,
  legacyColourThemeToRuntime,
  runtimePresentationVariables,
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

const emptyPresentation = { typography: { families: {}, sizes: {}, weights: {} }, spacing: {}, radii: {}, effects: { shadow: {}, insetShadow: {}, dropShadow: {}, textShadow: {} }, responsive: { breakpoints: {}, containers: {} } }

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

  it('applies the complete presentation families as runtime CSS variables', () => {
    const { style, values } = target()
    const application = createThemeApplication(style)
    const runtime = theme()
    runtime.presentation = {
      typography: {
        families: { sans: 'Runtime Sans, sans-serif' },
        sizes: { base: '1.125rem' },
        weights: { bold: '750' },
      },
      spacing: { 4: '18px' },
      radii: { DEFAULT: '6px' },
      effects: {
        shadow: { 'sm-base': '0 1px 2px #000' },
        insetShadow: { sm: 'inset 0 1px 2px #000' },
        dropShadow: { 'sm-base': '0 1px 1px #000' },
        textShadow: { 'sm-base': '0 1px 2px #000' },
      },
      responsive: {
        breakpoints: { md: '800px' },
        containers: { '2xl': '1600px' },
      },
    }

    application.apply(runtime)

    expect(values.get('--ui-font-sans')).toBe('Runtime Sans, sans-serif')
    expect(values.get('--ui-spacing-4')).toBe('18px')
    expect(values.get('--ui-radius')).toBe('6px')
    expect(values.has('--ui-radius-DEFAULT')).toBe(false)
    expect(values.get('--ui-text-shadow-sm-base')).toBe('0 1px 2px #000')
    expect(values.get('--ui-breakpoint-md')).toBe('800px')
    expect(values.get('--ui-container-2xl')).toBe('1600px')
    expect(application.appliedVariables).toHaveLength(25)
  })

  it('applies border, focus outline and ring widths when a theme sets them', () => {
    const { style, values } = target()
    const application = createThemeApplication(style)
    const runtime = theme()
    runtime.presentation = {
      ...emptyPresentation,
      borders: {
        widths: { DEFAULT: '1px', xs: '0.5px', lg: '5px' },
        focusRing: { width: '4px', offset: '1px' },
        ring: { width: '3px' },
      },
    }

    application.apply(runtime)

    expect(values.get('--ui-border-width')).toBe('1px')
    expect(values.get('--ui-border-width-xs')).toBe('0.5px')
    expect(values.get('--ui-border-width-lg')).toBe('5px')
    expect(values.get('--ui-focus-ring-width')).toBe('4px')
    expect(values.get('--ui-focus-ring-offset')).toBe('1px')
    expect(values.get('--ui-ring-width')).toBe('3px')
    expect(values.has('--ui-border-width-DEFAULT')).toBe(false)
    expect(application.appliedVariables).toHaveLength(14 + 6)
  })

  it('leaves the bundled widths in place when a theme has no borders group', () => {
    expect(runtimePresentationVariables(emptyPresentation)).toEqual([])
  })

  it('keeps DEFAULT as a suffix outside radii, so the base spacing unit stays fixed', () => {
    const names = runtimePresentationVariables({ ...emptyPresentation, spacing: { DEFAULT: '1rem' } }).map(([name]) => name)
    expect(names).toEqual(['--ui-spacing-DEFAULT'])
  })

  it('applies tracking, leading, effect and motion groups when a theme sets them', () => {
    const entries = new Map(runtimePresentationVariables({
      ...emptyPresentation,
      typography: { ...emptyPresentation.typography, tracking: { caps: '0.08em' }, leading: { snug: '1.4' } },
      effects: {
        ...emptyPresentation.effects,
        blur: { md: '10px' },
        perspective: { near: '250px' },
        tilt: { sm: '12deg' },
        aspect: { photo: '3 / 2' },
      },
      motion: {
        ease: { standard: 'cubic-bezier(0.2, 0, 0, 1)' },
        duration: { fast: '90ms', 'fast-exit': '60ms' },
        animate: { 'fade-in': 'fade-in 200ms ease-out both' },
      },
    }))
    expect(Object.fromEntries(entries)).toEqual({
      '--ui-tracking-caps': '0.08em',
      '--ui-leading-snug': '1.4',
      '--ui-blur-md': '10px',
      '--ui-perspective-near': '250px',
      '--ui-tilt-sm': '12deg',
      '--ui-aspect-photo': '3 / 2',
      '--ui-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
      '--ui-duration-fast': '90ms',
      '--ui-duration-fast-exit': '60ms',
      '--ui-animate-fade-in': 'fade-in 200ms ease-out both',
    })
  })

  it('rejects unknown motion keys and malformed optional groups', () => {
    expect(() => runtimePresentationVariables({ ...emptyPresentation, motion: { keyframes: {} } })).toThrow(/motion\.keyframes/)
    expect(() => runtimePresentationVariables({ ...emptyPresentation, motion: { ease: { 'a--b': 'linear' } } })).toThrow(/motion\.ease/)
    expect(() => runtimePresentationVariables({ ...emptyPresentation, effects: { ...emptyPresentation.effects, blur: 'big' } })).toThrow(/effects\.blur/)
    expect(() => runtimePresentationVariables({ ...emptyPresentation, typography: { ...emptyPresentation.typography, leading: { tight: ' ' } } })).toThrow(/non-empty/)
  })

  it('rejects unknown or unsafe border width keys', () => {
    const base = emptyPresentation
    expect(() => runtimePresentationVariables({ ...base, borders: { style: {} } })).toThrow(/borders\.style/)
    expect(() => runtimePresentationVariables({ ...base, borders: { focusRing: { colour: 'red' } } })).toThrow(/borders\.focusRing\.colour/)
    expect(() => runtimePresentationVariables({ ...base, borders: { widths: { 'x--y': '1px' } } })).toThrow(/borders\.widths/)
    expect(() => runtimePresentationVariables({ ...base, borders: { widths: { sm: '' } } })).toThrow(/non-empty/)
    expect(() => runtimePresentationVariables({ ...base, borders: [] })).toThrow(/borders/)
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
