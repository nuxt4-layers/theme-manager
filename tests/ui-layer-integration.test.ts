import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('TM-9 presentation-consumer boundary', () => {
  const pkg = JSON.parse(read('package.json')) as { exports: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
  const capability = JSON.parse(read('capability.json')) as { provides: Array<{ capability: string; contractVersion: string }>; requires: unknown[]; publicExports: string[] }
  const css = read('assets/css/main.css')
  const contract = read('docs/semantic-presentation-consumer-contract.md')

  it('publishes one deliberate semantic presentation stylesheet entry point', () => {
    expect(pkg.exports['./presentation.css']).toBe('./assets/css/main.css')
    expect(capability.publicExports).toContain('./presentation.css')
  })

  it('provides the versioned semantic presentation capability', () => {
    expect(capability.provides).toContainEqual({ capability: 'SemanticPresentationTheme', contractVersion: '1' })
  })

  it('does not reverse the dependency toward UI', () => {
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(dependencies)).not.toContain('@nuxt4-layers/ui')
    expect(capability.requires).toEqual([])
  })

  it('does not know consuming UI source topology', () => {
    expect(css).not.toContain('@source')
    expect(css.toLowerCase()).not.toContain('ui-library')
    expect(css.toLowerCase()).not.toContain('authentication')
  })

  it('keeps component styling outside Theme Manager', () => {
    expect(css).not.toMatch(/components\//)
    expect(contract).toContain('no UI component CSS')
  })

  it('keeps the consumer contract product-facing rather than migration-facing', () => {
    expect(contract).toContain('treats semantic presentation vocabulary as the styling boundary')
    expect(contract).toContain('does not mutate raw Theme state as a substitute for Theme Manager')
    expect(contract).not.toContain('downstream UI-capability migration obligation')
  })
})
