import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
// Comments document the grammar with placeholders such as var(--ui-<name>-light); only
// declarations and references in real CSS count.
const readCss = (path: string) => read(path).replace(/\/\*[\s\S]*?\*\//g, '')

const defaultCss = readCss('assets/css/theme/theme-default.css')
const apiCss = readCss('assets/css/theme/theme-api.css')
const tailwindCss = readCss('assets/css/tailwindcss/tailwind-config.css')
const mainCss = read('assets/css/main.css')

const declarations = (css: string, prefix: string) =>
  [...css.matchAll(new RegExp(`(${prefix}[\\w-]+)\\s*:`, 'g'))].map(match => match[1])


const defaultColourEntries = defaultCss
  .split(/\r?\n/)
  .map(line => line.trim().match(/^--ui-(fill|pen|edge)-(.+)-(light|dark):\s*(#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*;/))
  .filter((match): match is RegExpMatchArray => match !== null)
  .map(([, family, roleState, mode, value]) => ({
    family: family!,
    roleState: roleState!,
    mode: mode!,
    value: value!,
    alpha: value!.length === 9 ? Number.parseInt(value!.slice(7, 9), 16) / 255 : 1,
  }))

const defaultColour = (family: 'fill' | 'pen' | 'edge', roleState: string, mode: string) =>
  defaultColourEntries.find(entry =>
    entry.family === family && entry.roleState === roleState && entry.mode === mode,
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

const stateOf = (roleState: string) => roleState.slice(roleState.lastIndexOf('-') + 1)

const requireOpaquePair = (
  family: 'pen' | 'edge',
  roleState: string,
  mode: string,
  surface: { value: string, alpha: number },
) => {
  const partner = defaultColour(family, roleState, mode)
  if (!partner) return { error: `${mode} ${roleState}: missing ${family === 'pen' ? 'Pen' : 'Edge'} partner` }
  if (surface.alpha !== 1 || partner.alpha !== 1) {
    return { error: `${mode} ${roleState}: transparent applicable pair requires rendered compositing` }
  }
  return { ratio: contrastRatio(partner.value, surface.value) }
}

// Tailwind names that cannot share the --api-* suffix: partner properties use Tailwind's
// double-hyphen form, and plain utilities read --default-* names. Everything else is
// --<name>: var(--api-<name>).
const RENAMED_TAILWIND: Record<string, string> = {
  '--font-mono--font-feature-settings': '--api-font-mono-feature-settings',
  '--default-border-width': '--api-border-width',
  '--default-outline-width': '--api-focus-ring-width',
  '--outline-width-focus': '--api-focus-ring-width',
  '--outline-offset-focus': '--api-focus-ring-offset',
  '--default-ring-width': '--api-ring-width',
  '--ring-width-focus': '--api-ring-width',
  '--default-transition-duration': '--api-duration-base',
  '--default-transition-timing-function': '--api-ease-standard',
}

const expectedApiFor = (tailwind: string) => {
  if (RENAMED_TAILWIND[tailwind]) return RENAMED_TAILWIND[tailwind]!
  const lineHeight = tailwind.match(/^--text-([\w-]+)--line-height$/)
  if (lineHeight) return `--api-text-${lineHeight[1]}-line-height`
  return `--api-${tailwind.slice(2)}`
}

// --api-* names with no Tailwind namespace, used as arbitrary values instead
// (rotate-y-(--api-tilt-md), duration-(--api-duration-fast)); breakpoints are literal.
const ARBITRARY_VALUE_API = /^--api-(?:tilt|duration)-/

describe('TM-4 presentation engine', () => {
  it('preserves the recovered raw colour cardinality', () => {
    const raw = declarations(defaultCss, '--ui-').filter(name => /--ui-(fill|pen|edge)-/.test(name ?? ''))
    expect(raw).toHaveLength(980)
    expect(new Set(raw)).toHaveLength(980)
  })

  it('preserves the recovered semantic colour cardinality', () => {
    const semantic = declarations(apiCss, '--api-').filter(name => /--api-(fill|pen|edge)-/.test(name ?? ''))
    expect(semantic).toHaveLength(980)
    expect(new Set(semantic)).toHaveLength(490)
  })

  it('preserves the recovered Tailwind colour vocabulary cardinality', () => {
    const colours = declarations(tailwindCss, '--color-')
    expect(colours).toHaveLength(490)
    expect(new Set(colours)).toHaveLength(490)
  })

  it('keeps every Tailwind colour mapped to a semantic API property', () => {
    const semanticNames = new Set(declarations(apiCss, '--api-'))
    const mappings = [...tailwindCss.matchAll(/(--color-[\w-]+)\s*:\s*var\((--api-[\w-]+)\)/g)]
    expect(mappings).toHaveLength(490)
    expect(mappings.every(([, , api]) => semanticNames.has(api))).toBe(true)
  })

  it('keeps every semantic API property backed by raw light and dark values', () => {
    const rawNames = new Set(declarations(defaultCss, '--ui-'))
    const mappings = [...apiCss.matchAll(/(--api-(?:fill|pen|edge)-[\w-]+)\s*:\s*var\((--ui-(?:fill|pen|edge)-[\w-]+)-(light|dark)\)/g)]
    expect(mappings).toHaveLength(980)
    expect(mappings.every(([, , rawBase, mode]) => rawNames.has(`${rawBase}-${mode}`))).toBe(true)
  })

  it('preserves the recovered non-colour Tailwind vocabulary', () => {
    // --font- also matches the four --font-weight-* names.
    expect(declarations(tailwindCss, '--font-')).toHaveLength(8)
    expect(declarations(tailwindCss, '--text-').filter(name => !name?.startsWith('--text-shadow-'))).toHaveLength(28)
    expect(declarations(tailwindCss, '--font-weight-')).toHaveLength(4)
    expect(declarations(tailwindCss, '--breakpoint-')).toHaveLength(7)
    expect(declarations(tailwindCss, '--container-')).toHaveLength(16)
    expect(declarations(tailwindCss, '--spacing-')).toHaveLength(9)
    expect(declarations(tailwindCss, '--radius-')).toHaveLength(15)
    expect(tailwindCss).toContain('--radius: var(--api-radius);')
    expect(declarations(tailwindCss, '--shadow-')).toHaveLength(79)
    expect(declarations(tailwindCss, '--inset-shadow-')).toHaveLength(75)
    expect(declarations(tailwindCss, '--drop-shadow-')).toHaveLength(75)
    expect(declarations(tailwindCss, '--text-shadow-')).toHaveLength(75)
    expect(declarations(tailwindCss, '--border-width-')).toHaveLength(5)
    expect(declarations(tailwindCss, '--tracking-')).toHaveLength(4)
    expect(declarations(tailwindCss, '--leading-')).toHaveLength(5)
    expect(declarations(tailwindCss, '--ease-')).toHaveLength(7)
    expect(declarations(tailwindCss, '--animate-')).toHaveLength(7)
  })

  it('backs the complete non-colour Tailwind vocabulary through runtime API and defaults', () => {
    const tailwindNames = [...new Set(declarations(tailwindCss, '--').filter(name => !name?.startsWith('--color-')))]
    const apiNames = new Set(declarations(apiCss, '--api-'))
    const defaultNames = new Set(declarations(defaultCss, '--ui-'))
    const mappings = [...tailwindCss.matchAll(/(--(?!color-)[\w-]+)\s*:\s*var\((--api-[\w-]+)\)/g)]

    const runtimeTailwindNames = tailwindNames.filter(name => !name?.startsWith('--breakpoint-'))
    const breakpoints = tailwindNames.filter(name => name?.startsWith('--breakpoint-'))

    expect(tailwindNames).toHaveLength(438)
    expect(runtimeTailwindNames).toHaveLength(431)
    expect(breakpoints).toHaveLength(7)
    expect(mappings).toHaveLength(431)
    expect(mappings.every(([, tailwind, api]) => api === expectedApiFor(tailwind!))).toBe(true)
    expect(runtimeTailwindNames.every(name => apiNames.has(expectedApiFor(name!)))).toBe(true)
    expect(breakpoints.every(name => apiNames.has(`--api-${name!.slice(2)}`))).toBe(true)
    expect([...apiNames].every(name => defaultNames.has(`--ui-${name.slice('--api-'.length)}`)
      || (defaultNames.has(`--ui-${name.slice('--api-'.length)}-light`) && defaultNames.has(`--ui-${name.slice('--api-'.length)}-dark`)))).toBe(true)
    expect(breakpoints.every(name => {
      const declaration = tailwindCss.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))
      return declaration && !declaration[1]?.includes('var(')
    })).toBe(true)
  })

  it('keeps default radius values valid and upstream of the public API', () => {
    expect(defaultCss).toContain('--ui-radius: var(--ui-radius-md);')
    expect(defaultCss).toContain('--ui-radius-full: calc(infinity * 1px);')
    expect(defaultCss).not.toMatch(/--ui-radius-[\w-]+\s*:\s*var\(--(?:api-)?radius-/)
    expect(defaultCss).not.toContain('var(calc(')
  })

  it('keeps the default Theme self-contained from downstream presentation namespaces', () => {
    const downstreamReference = /var\(--(?:api-|color-|spacing-|radius-)/
    expect(defaultCss).not.toMatch(downstreamReference)

    // One :root block of --ui-* tokens: mode selection belongs to theme-api.css.
    expect(defaultCss).not.toContain('html.dark')
    expect(defaultCss).not.toContain('--tm-')
    expect(declarations(defaultCss, '--').every(name => name!.startsWith('--ui-'))).toBe(true)

    // Shadow shapes take their colour from the role's shadow tokens in the same mode.
    const shadowShapes = [...defaultCss.matchAll(/--ui-((?:inset-|drop-|text-)?shadow)-(?:xs|sm|md|lg|xl)-([a-z]+)-(light|dark)\s*:\s*([^;]+);/g)]
    expect(shadowShapes).toHaveLength(560)
    expect(shadowShapes.every(([, type, role, mode, value]) =>
      value!.includes(`var(--ui-${type === 'text-shadow' ? 'pen' : 'fill'}-${role}-shadow-${mode})`))).toBe(true)
  })

  it('parses the complete concrete Default Theme colour palette including alpha colours', () => {
    expect(defaultColourEntries).toHaveLength(980)
    expect(defaultColourEntries.filter(entry => entry.family === 'fill')).toHaveLength(336)
    expect(defaultColourEntries.filter(entry => entry.family === 'pen')).toHaveLength(336)
    expect(defaultColourEntries.filter(entry => entry.family === 'edge')).toHaveLength(308)

    // Shadow colours are translucent tints; every other colour is opaque.
    const transparent = defaultColourEntries.filter(entry => entry.alpha !== 1)
    expect(transparent).toHaveLength(56)
    expect(transparent.every(entry => stateOf(entry.roleState) === 'shadow')).toBe(true)
    expect(transparent.every(entry => entry.alpha > 0)).toBe(true)
  })

  it('keeps every statically computable non-disabled same-role Pen/Fill pair at WCAG AA normal-text contrast', () => {
    const fills = defaultColourEntries.filter(entry => entry.family === 'fill')
    const applicable = fills.filter(entry => !['shadow', 'disabled'].includes(stateOf(entry.roleState)))
    expect(applicable).toHaveLength(280)

    const failures = applicable.flatMap(({ roleState, mode, value, alpha }) => {
      const result = requireOpaquePair('pen', roleState, mode, { value, alpha })
      if (result.error) return [result.error]
      return result.ratio! < 4.5 ? [`${mode} ${roleState}: ${result.ratio!.toFixed(3)}:1`] : []
    })

    expect(failures).toEqual([])
  })

  it('keeps every statically computable non-disabled same-role Edge/Fill pair at WCAG non-text contrast', () => {
    // The focus ring is drawn outside the control with an offset, so it is checked
    // against the page layers instead (next test).
    const fills = defaultColourEntries.filter(entry => entry.family === 'fill')
    const applicable = fills.filter(entry => !['shadow', 'disabled', 'focus'].includes(stateOf(entry.roleState)))
    expect(applicable).toHaveLength(252)

    const failures = applicable.flatMap(({ roleState, mode, value, alpha }) => {
      const result = requireOpaquePair('edge', roleState, mode, { value, alpha })
      if (result.error) return [result.error]
      return result.ratio! < 3 ? [`${mode} ${roleState}: ${result.ratio!.toFixed(3)}:1`] : []
    })

    expect(failures).toEqual([])
  })

  it('keeps every focus ring at WCAG non-text contrast against every page layer it can sit on', () => {
    const layers = ['floor', 'base', 'primary', 'secondary', 'tertiary']
    const failures: string[] = []

    for (const mode of ['light', 'dark']) {
      for (const focus of defaultColourEntries.filter(entry =>
        entry.family === 'edge' && entry.mode === mode && stateOf(entry.roleState) === 'focus')) {
        for (const layer of layers) {
          const surface = defaultColour('fill', `${layer}-default`, mode)!
          const ratio = contrastRatio(focus.value, surface.value)
          if (ratio < 3) failures.push(`${mode} ${focus.roleState} on ${layer}: ${ratio.toFixed(3)}:1`)
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('keeps context-dependent and disabled colours outside the static contrast calculation explicitly', () => {
    const disabled = defaultColourEntries.filter(entry => stateOf(entry.roleState) === 'disabled')
    expect(disabled.filter(entry => entry.family === 'fill')).toHaveLength(28)
    expect(disabled.filter(entry => entry.family === 'pen')).toHaveLength(28)
    expect(disabled.filter(entry => entry.family === 'edge')).toHaveLength(28)

    const shadows = defaultColourEntries.filter(entry => stateOf(entry.roleState) === 'shadow')
    expect(shadows.filter(entry => entry.family === 'fill')).toHaveLength(28)
    expect(shadows.filter(entry => entry.family === 'pen')).toHaveLength(28)
    expect(shadows.filter(entry => entry.family === 'edge')).toHaveLength(0)
    expect(shadows.filter(entry => entry.alpha !== 1)).toHaveLength(56)
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

    expect(defaultUi.size).toBe(1731)
    expect(api.size).toBe(937)

    // Closure is proved from the references actually written in the CSS, not by
    // guessing naming transformations between the three namespaces.
    expect([...defaultUi].filter(name => !apiUiReferences.has(name))).toEqual([])
    expect([...apiUiReferences].filter(name => !defaultUi.has(name))).toEqual([])
    expect([...api].filter(name =>
      !tailwindApiReferences.has(name) && !breakpointApi.has(name) && !ARBITRARY_VALUE_API.test(name))).toEqual([])
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

    expect(defaultDuplicates).toEqual([])

    // Mode-dependent tokens are declared once in :root (light) and once in html.dark.
    expect(apiDuplicates).toHaveLength(794)
    expect(apiDuplicates.every(name => /^--api-(?:fill|pen|edge|shadow|inset-shadow|drop-shadow|text-shadow)-/.test(name))).toBe(true)
    expect(apiDuplicates.every(name => declarations(apiCss, '--').filter(declared => declared === name).length === 2)).toBe(true)

    expect(tailwindDuplicates).toEqual([])
  })

  it('keeps light and dark colour grammar exactly symmetric', () => {
    const rawColour = new Set(
      declarations(defaultCss, '--ui-').filter(name => /^--ui-(?:fill|pen|edge)-/.test(name)),
    )
    const light = [...rawColour].filter(name => name.endsWith('-light'))
    const dark = [...rawColour].filter(name => name.endsWith('-dark'))

    expect(light).toHaveLength(490)
    expect(dark).toHaveLength(490)
    expect(light.map(name => name.replace(/-light$/, '')).sort())
      .toEqual(dark.map(name => name.replace(/-dark$/, '')).sort())

    const semanticColour = new Set(
      declarations(apiCss, '--api-').filter(name => /^--api-(?:fill|pen|edge)-/.test(name)),
    )
    expect(semanticColour.size).toBe(490)

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
