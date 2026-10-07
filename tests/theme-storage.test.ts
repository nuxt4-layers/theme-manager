import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  clearThemeRepositoryProvider, hasThemeRepository, provideThemeRepository, ThemeStorageUnavailableError, useThemeRepository,
} from '../server/utils/theme-repository'

const repository = { findById: async () => null, list: async () => [], save: async () => {}, delete: async () => {} }

describe('stand-alone Theme Manager (no storage)', () => {
  afterEach(() => clearThemeRepositoryProvider())

  it('reports storage only when the host provides a repository', () => {
    expect(hasThemeRepository()).toBe(false)
    provideThemeRepository({ getThemeRepository: () => repository })
    expect(hasThemeRepository()).toBe(true)
  })

  it('fails closed with 503, never an implicit in-memory store', () => {
    expect(() => useThemeRepository()).toThrow(ThemeStorageUnavailableError)
    // theme-http needs h3 (a Nitro runtime import), so its mapping is checked in source.
    const http = readFileSync(new URL('../server/utils/theme-http.ts', import.meta.url), 'utf8')
    expect(http).toContain("ThemeStorageUnavailableError) throw createError({ statusCode: 503")
  })
})
