import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('TM-10 composition and legacy-retirement gate', () => {
  const pkg = JSON.parse(read('package.json')) as {
    exports: Record<string, string>
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const capability = JSON.parse(read('capability.json')) as {
    requires: unknown[]
    publicExports: string[]
  }
  const retirement = read('docs/archive/migration/tm-10-composition-legacy-retirement.md')
  const composition = read('docs/composition-contract.md')

  it('retains the complete TM-0 through TM-10 migration record', () => {
    for (let stage = 0; stage <= 10; stage += 1) {
      const entries = [
        'tm-0-legacy-assets-architecture-audit.md',
        'tm-1-legacy-theme-manager-functional-audit.md',
        'tm-2-target-architecture-and-contracts.md',
        'tm-3-new-repository-foundation.md',
        'tm-4-presentation-engine-migration.md',
        'tm-5-runtime-engine-migration.md',
        'tm-6-persistence-theme-management.md',
        'tm-7-theme-management-ui.md',
        'tm-8-user-group-integration.md',
        'tm-9-ui-layer-integration.md',
        'tm-10-composition-legacy-retirement.md',
      ]
      expect(existsSync(resolve(root, 'docs/archive/migration', entries[stage]!))).toBe(true)
    }
  })

  it('records immutable legacy evidence and forbids TM-10 mutation', () => {
    expect(retirement).toContain('8847e6b1d8ebbca83f00d17b0cddb18522219c6e')
    expect(retirement).toContain('No TM-10 write operation targets that repository')
    expect(retirement).toContain('remains unchanged as immutable migration evidence')
  })

  it('does not depend on legacy, UI, Authentication, Identity or Authorization packages', () => {
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
    const names = Object.keys(dependencies)
    expect(names.some(name => /legacy-theme-manager/i.test(name))).toBe(false)
    expect(names).not.toContain('@nuxt4-layers/ui')
    expect(names).not.toContain('@nuxt4-layers/authentication')
    expect(names).not.toContain('@nuxt4-layers/identity')
    expect(names).not.toContain('@nuxt4-layers/authorization')
    expect(capability.requires).toEqual([])
  })

  it('keeps the deliberate public package surface aligned with capability metadata', () => {
    expect(Object.keys(pkg.exports)).toEqual([
      '.',
      './contracts',
      './capability',
      './presentation.css',
    ])
    expect(capability.publicExports).toEqual(Object.keys(pkg.exports))
  })

  it('makes the host application the composition root with pinned consumption', () => {
    expect(composition).toContain('host Nuxt application is the composition root')
    expect(composition).toContain('pinned Git-backed dependency')
    expect(composition).toContain('lockfile records the exact resolved revision')
    expect(composition).toContain('supplies a `ThemeRepository` adapter')
    expect(composition).toContain('supplies `ThemeActorContextProvider` and `ThemeAuthorizationService`')
  })

  it('closes the migration programme without claiming downstream UI migration is complete', () => {
    expect(retirement).toContain('Theme Manager migration programme TM-0 → TM-10 is complete')
    expect(retirement).toContain('separate UI migration')
  })
})
