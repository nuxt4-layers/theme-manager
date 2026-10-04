import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const defaultCss = read('assets/css/theme/theme-default.css')
const apiCss = read('assets/css/theme/theme-api.css')
const tailwindCss = read('assets/css/tailwindcss/tailwind-config.css')
const mainCss = read('assets/css/main.css')

const declarations = (css: string, prefix: string) =>
  [...css.matchAll(new RegExp(`(${prefix}[\\w-]+)\\s*:`, 'g'))].map(match => match[1])


const defaultColours = new Map(
  [...defaultCss.matchAll(/--ui-(fill|pen|edge)-([\\w-]+)-(light|dark)\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;/g)]
    .map(([, family, roleState, mode, value]) => [`${family}|${roleState}|${mode}`, value!] as const),
)

const relativeLuminance = (hex: string) => {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return (0.2126 * channels[0]!) + (0.7152 * channels[1]!) + (0.0722 * channels[2]!)
}

const contrastRatio = (first: string, second: string) => {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05)
}

const semanticColourParts = (roleState: string) => {
  const separator = roleState.lastIndexOf('-')
  return {
    role: roleState.slice(0, separator),
    state: roleState.slice(separator + 1),
  }
}

describe('TM-4 presentation engine', () => {
  it('preserves the recovered raw colour cardinality', () => {
    const raw = declarations(defaultCss, '--ui-').filter(name => /--ui-(fill|pen|edge)-/.test(name ?? ''))
    expect(raw).toHaveLength(560)
    expect(new Set(raw)).toHaveLength(560)
  })

  it('preserves the recovered semantic colour cardinality', () => {
    const semantic = declarations(apiCss, '--api-').filter(name => /--api-(fill|pen|edge)-/.test(name ?? ''))
    expect(semantic).toHaveLength(560)
    expect(new Set(semantic)).toHaveLength(280)
  })

  it('preserves the recovered Tailwind colour vocabulary cardinality', () => {
    const colours = declarations(tailwindCss, '--color-')
    expect(colours).toHaveLength(280)
    expect(new Set(colours)).toHaveLength(280)
  })

  it('keeps every Tailwind colour mapped to a semantic API property', () => {
    const semanticNames = new Set(declarations(apiCss, '--api-'))
    const mappings = [...tailwindCss.matchAll(/(--color-[\w-]+)\s*:\s*var\((--api-[\w-]+)\)/g)]
    expect(mappings).toHaveLength(280)
    expect(mappings.every(([, , api]) => semanticNames.has(api))).toBe(true)
  })

  it('keeps every semantic API property backed by raw light and dark values', () => {
    const rawNames = new Set(declarations(defaultCss, '--ui-'))
    const mappings = [...apiCss.matchAll(/(--api-(?:fill|pen|edge)-[\w-]+)\s*:\s*var\((--ui-(?:fill|pen|edge)-[\w-]+)-(light|dark)\)/g)]
    expect(mappings).toHaveLength(560)
    expect(mappings.every(([, , rawBase, mode]) => rawNames.has(`${rawBase}-${mode}`))).toBe(true)
  })

  it('preserves the recovered non-colour Tailwind vocabulary', () => {
    expect(declarations(tailwindCss, '--font-')).toHaveLength(10)
    expect(declarations(tailwindCss, '--text-').filter(name => !name?.startsWith('--text-shadow-'))).toHaveLength(7)
    expect(declarations(tailwindCss, '--font-weight-')).toHaveLength(7)
    expect(declarations(tailwindCss, '--breakpoint-')).toHaveLength(8)
    expect(declarations(tailwindCss, '--container-')).toHaveLength(2)
    expect(declarations(tailwindCss, '--spacing-')).toHaveLength(31)
    expect(declarations(tailwindCss, '--radius-')).toHaveLength(6)
    expect(declarations(tailwindCss, '--shadow-')).toHaveLength(56)
    expect(declarations(tailwindCss, '--inset-shadow-')).toHaveLength(60)
    expect(declarations(tailwindCss, '--drop-shadow-')).toHaveLength(56)
    expect(declarations(tailwindCss, '--text-shadow-')).toHaveLength(56)
  })

  it('backs the complete non-colour Tailwind vocabulary through runtime API and defaults', () => {
    const tailwindNames = [...new Set(declarations(tailwindCss, '--').filter(name => !name?.startsWith('--color-')))]
    const apiNames = new Set(declarations(apiCss, '--api-'))
    const defaultNames = new Set(declarations(defaultCss, '--ui-'))
    const mappings = [...tailwindCss.matchAll(/(--(?!color-)[\w-]+)\s*:\s*var\((--api-[\w-]+)\)/g)]

    const runtimeTailwindNames = tailwindNames.filter(name => !name?.startsWith('--breakpoint-'))
    const breakpoints = tailwindNames.filter(name => name?.startsWith('--breakpoint-'))

    expect(tailwindNames).toHaveLength(292)
    expect(runtimeTailwindNames).toHaveLength(284)
    expect(breakpoints).toHaveLength(8)
    expect(mappings).toHaveLength(284)
    expect(mappings.every(([, tailwind, api]) => api === `--api-${tailwind!.slice(2)}`)).toBe(true)
    expect(tailwindNames.every(name => apiNames.has(`--api-${name!.slice(2)}`))).toBe(true)
    expect(tailwindNames.every(name => defaultNames.has(`--ui-${name!.slice(2)}`))).toBe(true)
    expect(breakpoints.every(name => {
      const declaration = tailwindCss.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))
      return declaration && !declaration[1]?.includes('var(')
    })).toBe(true)
  })

  it('keeps default radius values valid and upstream of the public API', () => {
    expect(defaultCss).toContain('--ui-radius-DEFAULT: var(--ui-radius-md);')
    expect(defaultCss).toContain('--ui-radius-full: calc(infinity * 1px);')
    expect(defaultCss).not.toMatch(/--ui-radius-[\w-]+\s*:\s*var\(--(?:api-)?radius-/)
    expect(defaultCss).not.toContain('var(calc(')
  })

  it('keeps the default Theme self-contained from downstream presentation namespaces', () => {
    const downstreamReference = /var\(--(?:api-|color-|spacing-|radius-)/
    expect(defaultCss).not.toMatch(downstreamReference)

    expect(defaultCss).toContain('--ui-spacing-1: var(--ui-spacing-p-xs);')
    expect(defaultCss).toContain('--tm-shadow-color-fill-base: var(--ui-fill-base-shadow-light);')
    expect(defaultCss).toContain('--tm-shadow-color-pen-base: var(--ui-pen-base-shadow-light);')
    expect(defaultCss).toContain('--tm-shadow-color-fill-base: var(--ui-fill-base-shadow-dark);')
    expect(defaultCss).toContain('--tm-shadow-color-pen-base: var(--ui-pen-base-shadow-dark);')
  })

  it('keeps every intended non-disabled same-role Pen/Fill pair at WCAG AA normal-text contrast', () => {
    const failures: string[] = []
    let checked = 0

    for (const [key, fill] of defaultColours) {
      const [family, roleState, mode] = key.split('|')
      if (family !== 'fill') continue
      const { state } = semanticColourParts(roleState!)
      if (state === 'shadow' || state === 'disabled') continue

      const pen = defaultColours.get(`pen|${roleState}|${mode}`)
      expect(pen, `missing Pen partner for ${mode} ${roleState}`).toBeDefined()
      checked += 1

      const ratio = contrastRatio(pen!, fill)
      if (ratio < 4.5) failures.push(`${mode} ${roleState}: ${ratio.toFixed(3)}:1`)
    }

    expect(checked).toBe(140)
    expect(failures).toEqual([])
  })

  it('keeps every intended non-disabled same-role Edge/Fill pair at WCAG non-text contrast', () => {
    const failures: string[] = []
    let checked = 0

    for (const [key, fill] of defaultColours) {
      const [family, roleState, mode] = key.split('|')
      if (family !== 'fill') continue
      const { state } = semanticColourParts(roleState!)
      if (state === 'shadow' || state === 'disabled') continue

      const edge = defaultColours.get(`edge|${roleState}|${mode}`)
      expect(edge, `missing Edge partner for ${mode} ${roleState}`).toBeDefined()
      checked += 1

      const ratio = contrastRatio(edge!, fill)
      if (ratio < 3) failures.push(`${mode} ${roleState}: ${ratio.toFixed(3)}:1`)
    }

    expect(checked).toBe(140)
    expect(failures).toEqual([])
  })

  it('documents disabled pairs as deliberately exempt from normal WCAG contrast thresholds', () => {
    const disabledFillPairs = [...defaultColours.keys()]
      .filter(key => key.startsWith('fill|') && key.includes('-disabled|'))
    const disabledEdgePairs = [...defaultColours.keys()]
      .filter(key => key.startsWith('edge|') && key.includes('-disabled|'))

    expect(disabledFillPairs).toHaveLength(28)
    expect(disabledEdgePairs).toHaveLength(28)
  })

  it('keeps default focus-capable Edge tokens distinguishable from their same-role Fill surfaces', () => {
    // This protects the palette's potential visible boundary. It does not claim WCAG
    // focus-appearance conformance, which depends on the rendered component, adjacent
    // colours, indicator area/thickness and focus implementation.
    const failures: string[] = []
    for (const mode of ['light', 'dark']) {
      for (const role of ['base', 'primary', 'secondary', 'tertiary', 'accent', 'muted', 'floor', 'input', 'link', 'success', 'info', 'warning', 'error', 'notification']) {
        for (const state of ['default', 'hover', 'active', 'selected', 'visited']) {
          const fill = defaultColours.get(`fill|${role}-${state}|${mode}`)
          const edge = defaultColours.get(`edge|${role}-${state}|${mode}`)
          expect(fill, `missing Fill for ${mode} ${role}-${state}`).toBeDefined()
          expect(edge, `missing Edge for ${mode} ${role}-${state}`).toBeDefined()
          if (contrastRatio(edge!, fill!) < 3) {
            failures.push(`${mode} ${role}-${state}`)
          }
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('preserves chromatic identity for semantic default edges', () => {
    const semanticRoles = ['primary', 'secondary', 'accent', 'link', 'success', 'info', 'warning', 'error', 'notification']
    const failures: string[] = []

    for (const mode of ['light', 'dark']) {
      for (const role of semanticRoles) {
        const match = defaultCss.match(new RegExp(`--ui-edge-${role}-default-${mode}\\s*:\\s*#([0-9a-fA-F]{6})`))
        if (!match) {
          failures.push(`${mode} ${role}: missing`)
          continue
        }

        const channels = [0, 2, 4].map(index => Number.parseInt(match[1]!.slice(index, index + 2), 16))
        if (Math.max(...channels) - Math.min(...channels) < 12) failures.push(`${mode} ${role}: achromatic`)
      }
    }

    expect(failures).toEqual([])
  })

  it('closes the actual Default → API → Tailwind reference graph bidirectionally', () => {
    const defaultUi = new Set(declarations(defaultCss, '--ui-'))
    const api = new Set(declarations(apiCss, '--api-'))
    const apiUiReferences = new Set(
      [...apiCss.matchAll(/var\((--ui-[\w-]+)\)/g)].map(([, name]) => name!),
    )
    const tailwindApiReferences = new Set(
      [...tailwindCss.matchAll(/var\((--api-[\w-]+)\)/g)].map(([, name]) => name!),
    )
    const breakpointApi = new Set(
      declarations(tailwindCss, '--breakpoint-').map(name => `--api-${name!.slice(2)}`),
    )

    expect(defaultUi.size).toBe(852)
    expect(api.size).toBe(572)

    // Closure is proved from the references actually written in the CSS, not by
    // guessing naming transformations between the three namespaces.
    expect([...defaultUi].filter(name => !apiUiReferences.has(name))).toEqual([])
    expect([...apiUiReferences].filter(name => !defaultUi.has(name))).toEqual([])
    expect([...api].filter(name => !tailwindApiReferences.has(name) && !breakpointApi.has(name))).toEqual([])
    expect([...tailwindApiReferences].filter(name => !api.has(name))).toEqual([])
  })

  it('permits only the intentional mode-dependent duplicate declarations', () => {
    const duplicates = (css: string, prefix: string) => {
      const names = declarations(css, prefix)
      return [...new Set(names.filter((name, index) => names.indexOf(name) !== index))]
    }

    const defaultDuplicates = duplicates(defaultCss, '--')
    const apiDuplicates = duplicates(apiCss, '--')
    const tailwindDuplicates = duplicates(tailwindCss, '--')

    expect(defaultDuplicates).toHaveLength(28)
    expect(defaultDuplicates.every(name => /^--tm-shadow-color-(?:fill|pen)-/.test(name))).toBe(true)

    expect(apiDuplicates).toHaveLength(280)
    expect(apiDuplicates.every(name => /^--api-(?:fill|pen|edge)-/.test(name))).toBe(true)

    expect(tailwindDuplicates).toEqual([])
  })

  it('keeps light and dark colour grammar exactly symmetric', () => {
    const rawColour = new Set(
      declarations(defaultCss, '--ui-').filter(name => /^--ui-(?:fill|pen|edge)-/.test(name)),
    )
    const light = [...rawColour].filter(name => name.endsWith('-light'))
    const dark = [...rawColour].filter(name => name.endsWith('-dark'))

    expect(light).toHaveLength(280)
    expect(dark).toHaveLength(280)
    expect(light.map(name => name.replace(/-light$/, '')).sort())
      .toEqual(dark.map(name => name.replace(/-dark$/, '')).sort())

    const semanticColour = new Set(
      declarations(apiCss, '--api-').filter(name => /^--api-(?:fill|pen|edge)-/.test(name)),
    )
    expect(semanticColour.size).toBe(280)

    for (const semantic of semanticColour) {
      const rawBase = semantic.replace(/^--api-/, '--ui-')
      expect(rawColour.has(`${rawBase}-light`)).toBe(true)
      expect(rawColour.has(`${rawBase}-dark`)).toBe(true)
    }
  })

  it('has no dangling CSS custom-property references across the three-stage pipeline', () => {
    const declared = new Set([
      ...declarations(defaultCss, '--'),
      ...declarations(apiCss, '--'),
      ...declarations(tailwindCss, '--'),
    ])
    const references = [defaultCss, apiCss, tailwindCss]
      .flatMap(css => [...css.matchAll(/var\((--[\w-]+)/g)].map(([, name]) => name!))

    expect([...new Set(references.filter(name => !declared.has(name)))]).toEqual([])
  })

  it('keeps static Tailwind breakpoints equal to their Default values while API metadata references them', () => {
    const values = (css: string) =>
      new Map(
        [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
          .map(([, name, value]) => [name!, value!.trim()] as const),
      )

    const tailwindValues = values(tailwindCss)
    const apiValues = values(apiCss)
    const defaultValues = values(defaultCss)

    for (const name of declarations(tailwindCss, '--breakpoint-')) {
      const suffix = name!.slice(2)
      const apiName = `--api-${suffix}`
      const uiName = `--ui-${suffix}`

      expect(tailwindValues.get(name!)).toBe(defaultValues.get(uiName))
      expect(apiValues.get(apiName)).toBe(`var(${uiName})`)
    }
  })

  it('does not couple Theme Manager to consumer source topology or UI component CSS', () => {
    expect(mainCss).not.toContain('@source')
    expect(mainCss).not.toContain('components/')
    expect(mainCss).not.toContain('ui-library')
    expect(mainCss).not.toContain('authentication')
  })
})
