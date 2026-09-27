import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const manifest = JSON.parse(readFileSync(resolve(root, 'capability.json'), 'utf8'))

describe('Theme Manager repository foundation', () => {
  it('keeps package and capability manifest identity/version aligned', () => {
    expect(manifest.name).toBe(pkg.name)
    expect(manifest.version).toBe(pkg.version)
    expect(manifest.classification).toBe('foundation')
  })

  it('publishes deliberate root, contracts and capability entry points', () => {
    expect(pkg.exports).toEqual({
      '.': './nuxt.config.ts',
      './contracts': './contracts/index.ts',
      './capability': './capability.json',
    })
  })

  it('declares no mandatory cross-capability dependency at foundation stage', () => {
    expect(manifest.requires).toEqual([])
  })
})
