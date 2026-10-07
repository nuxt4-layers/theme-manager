import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'
import { ThemeValidationError } from '../shared/theme-definition'
import { stampVocabulary, THEME_MANAGER_VERSION, THEME_VOCABULARY_VERSION, upgradeStoredTheme } from '../shared/theme-version'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
const userTheme = () => createCanonicalThemeDefinition({ id: 'mine', name: 'Mine', ownerType: 'user', ownerId: 'u1' })

describe('theme versioning', () => {
  it('versions system themes by the release they ship in', () => {
    expect(THEME_MANAGER_VERSION).toBe(pkg.version)
    expect(createCanonicalThemeDefinition().version).toBe(THEME_MANAGER_VERSION)
    expect(userTheme().version).toBe('1.0.0')
    expect(userTheme().schemaVersion).toBe(THEME_VOCABULARY_VERSION)
  })

  it('fills tokens a stored theme lacks and keeps its own versions', () => {
    const stored = userTheme()
    stored.version = '3.2.0'
    delete (stored.presentation.motion as Record<string, unknown> | undefined)?.duration
    delete (stored.modes.light as Record<string, unknown>)['fill-accent']
    const upgraded = upgradeStoredTheme(stored)
    expect(upgraded.version).toBe('3.2.0')
    expect(upgraded.schemaVersion).toBe(stored.schemaVersion)
    expect((upgraded.presentation.motion as Record<string, unknown>).duration).toEqual(createCanonicalThemeDefinition().presentation.motion!.duration)
    expect(upgraded.modes.light).toHaveProperty('fill-accent')
  })

  it('keeps a stored theme\'s own values over the defaults', () => {
    const stored = userTheme();
    (stored.presentation.radii as Record<string, string>).md = '7px'
    expect((upgradeStoredTheme(stored).presentation.radii as Record<string, string>).md).toBe('7px')
  })

  it('refuses a theme from a newer or unreadable vocabulary', () => {
    expect(() => upgradeStoredTheme({ ...userTheme(), schemaVersion: String(Number(THEME_VOCABULARY_VERSION) + 1) })).toThrow(ThemeValidationError)
    expect(() => upgradeStoredTheme({ ...userTheme(), schemaVersion: 'v1' })).toThrow(ThemeValidationError)
  })

  it('stamps a saved theme with this release\'s vocabulary', () => {
    expect(stampVocabulary({ ...userTheme(), schemaVersion: '0' }).schemaVersion).toBe(THEME_VOCABULARY_VERSION)
  })
})
