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
    const mappings = [...apiCss.matchAll(/(--api-[\w-]+)\s*:\s*var\((--ui-[\w-]+)-(light|dark)\)/g)]
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
    const mappings = [...tailwindCss.matchAll(/(--(?!color-)[\\w-]+)\\s*:\\s*var\\((--api-[\\w-]+)\\)/g)]

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
      const declaration = tailwindCss.match(new RegExp(`${name}\\\\s*:\\\\s*([^;]+);`))
      return declaration && !declaration[1]?.includes('var(')
    })).toBe(true)
  })

  it('does not couple Theme Manager to consumer source topology or UI component CSS', () => {
    expect(mainCss).not.toContain('@source')
    expect(mainCss).not.toContain('components/')
    expect(mainCss).not.toContain('ui-library')
    expect(mainCss).not.toContain('authentication')
  })
})
