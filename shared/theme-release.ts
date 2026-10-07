// Release constants, kept free of imports so any module may read them.

/** This Theme Manager release (package.json `version`; a test keeps them equal). */
export const THEME_MANAGER_VERSION = '0.1.0'

/**
 * The token vocabulary this release reads and writes. Raise it when a release adds,
 * renames or removes tokens; a stored Theme from an older vocabulary is completed on
 * load, one from a newer vocabulary is refused (this release cannot know its tokens).
 */
export const THEME_VOCABULARY_VERSION = '1'
