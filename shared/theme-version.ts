import type { ThemeDefinition } from '../contracts'
import { completeThemeVocabulary } from './canonical-theme'
import { ThemeValidationError } from './theme-definition'
import { THEME_MANAGER_VERSION, THEME_VOCABULARY_VERSION } from './theme-release'

// Two levels of versioning:
// - System Themes (the built-in default included) ship in the package, so their
//   `version` is the Theme Manager release. They change only by upgrading the layer.
// - Stored Themes keep their own `version`; `schemaVersion` records the token
//   vocabulary they were built against. Loading one fills in tokens added by later
//   releases from the default, so stored Themes survive upgrades.

export { THEME_MANAGER_VERSION, THEME_VOCABULARY_VERSION }

function vocabularyNumber(schemaVersion: string): number | null {
  return /^\d+$/.test(schemaVersion) ? Number(schemaVersion) : null
}

/**
 * Brings a stored Theme up to this release's vocabulary: tokens it lacks take the
 * default's values. Its own `version` and `schemaVersion` are kept, so the record
 * still says what it was built against until it is next saved.
 */
export function upgradeStoredTheme(theme: ThemeDefinition): ThemeDefinition {
  const stored = vocabularyNumber(theme.schemaVersion)
  if (stored === null) throw new ThemeValidationError(`Theme '${theme.id}' has an unreadable schemaVersion '${theme.schemaVersion}'.`)
  if (stored > Number(THEME_VOCABULARY_VERSION)) {
    throw new ThemeValidationError(`Theme '${theme.id}' was built for a newer Theme Manager (vocabulary ${theme.schemaVersion}); this release reads vocabulary ${THEME_VOCABULARY_VERSION}.`)
  }
  return completeThemeVocabulary(theme)
}

/** A Theme as it is saved: complete in this release's vocabulary, and stamped so. */
export function stampVocabulary(theme: ThemeDefinition): ThemeDefinition {
  return { ...upgradeStoredTheme(theme), schemaVersion: THEME_VOCABULARY_VERSION }
}
