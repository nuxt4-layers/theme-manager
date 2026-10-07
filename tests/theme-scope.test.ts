import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const readCss = (path: string) => readFileSync(resolve(root, path), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const apiCss = readCss('assets/css/theme/theme-api.css')
const scopeCss = readCss('assets/css/theme/theme-scope.css')
const defaultCss = readCss('assets/css/theme/theme-default.css')
const tailwindCss = readCss('assets/css/tailwindcss/tailwind-config.css')
const mainCss = readCss('assets/css/main.css')

// Every block of a stylesheet, as selector → mappings in order.
const blocks = (css: string) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, body]) => ({
    selector: selector!.trim(),
    mappings: [...body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => `${name}: ${value!.trim()}`),
    body: body!,
  }))

describe('scoped theme mappings', () => {
  const api = blocks(apiCss)
  const scope = blocks(scopeCss)
  const block = (list: typeof api, selector: string) => list.filter(entry => entry.selector === selector)

  it('repeats the light, dark and mode-independent theme-api.css mappings on [data-theme-scope]', () => {
    const [apiLight, apiModeless] = block(api, ':root')
    const [apiDark] = block(api, 'html.dark')
    const [scopeLight] = block(scope, '[data-theme-scope="light"]')
    const [scopeDark] = block(scope, '[data-theme-scope="dark"]')
    const [scopeModeless] = block(scope, '[data-theme-scope]')

    expect(scopeLight!.mappings).toEqual(apiLight!.mappings)
    expect(scopeDark!.mappings).toEqual(apiDark!.mappings)
    expect(scopeModeless!.mappings.slice(0, apiModeless!.mappings.length)).toEqual(apiModeless!.mappings)
    expect(scopeLight!.mappings).toHaveLength(794)
    expect(scopeModeless!.mappings.filter(mapping => mapping.startsWith('--api-'))).toHaveLength(143)
  })

  it('sets the browser colour scheme of each scope', () => {
    expect(block(scope, '[data-theme-scope="light"]')[0]!.body).toContain('color-scheme: light;')
    expect(block(scope, '[data-theme-scope="dark"]')[0]!.body).toContain('color-scheme: dark;')
  })

  it('re-declares every --color-* name the @keyframes read, so scoped animations follow the scope', () => {
    const keyframeColours = [...new Set([...tailwindCss.matchAll(/@keyframes[^{]+\{[\s\S]*?\n\}/g)]
      .flatMap(([keyframes]) => [...keyframes.matchAll(/var\((--color-[\w-]+)\)/g)].map(([, name]) => name!)))]
    expect(keyframeColours.length).toBeGreaterThan(0)

    const modeless = block(scope, '[data-theme-scope]')[0]!.mappings
    for (const name of keyframeColours) {
      expect(modeless).toContain(`${name}: var(--api-${name.slice('--color-'.length)})`)
    }
  })

  it('references only --ui-* and --api-* names that exist', () => {
    const ui = new Set([...defaultCss.matchAll(/(--ui-[\w-]+)\s*:/g)].map(([, name]) => name))
    const apiNames = new Set([...scopeCss.matchAll(/(--api-[\w-]+)\s*:/g)].map(([, name]) => name))
    const references = [...scopeCss.matchAll(/var\((--[\w-]+)\)/g)].map(([, name]) => name!)
    expect(references.filter(name => name.startsWith('--ui-') ? !ui.has(name) : !apiNames.has(name))).toEqual([])
  })

  it('is loaded after the locked pipeline files', () => {
    const order = ['theme-default.css', 'theme-api.css', 'tailwind-config.css', 'theme-scope.css']
      .map(file => mainCss.indexOf(file))
    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((left, right) => left - right)).toEqual(order)
  })
})
