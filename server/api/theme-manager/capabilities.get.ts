import { hasThemeRepository } from '../../utils/theme-repository'

/** What this composition supports, so the pages offer only what can work. */
export default defineEventHandler(() => ({ storage: hasThemeRepository() }))
