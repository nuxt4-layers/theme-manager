import type { ThemeDefinition, ThemeRepository, ThemeSummary } from '../../contracts'
import { parsePersistedTheme, parseThemeDefinition, serializeThemeDefinition, summarizeTheme } from '../../shared/theme-definition'

export class ThemeConflictError extends Error {}
export class ThemeNotFoundError extends Error {}
export class ProtectedThemeError extends Error {}

export interface ThemeService {
  list(): Promise<ThemeSummary[]>
  find(id: string): Promise<ThemeDefinition | null>
  create(input: unknown): Promise<ThemeDefinition>
  update(id: string, input: unknown): Promise<ThemeDefinition>
  delete(id: string): Promise<void>
}

export function createThemeService(repository: ThemeRepository): ThemeService {
  const find = async (id: string) => {
    const persisted = await repository.findById(id)
    return persisted === null ? null : parsePersistedTheme(persisted)
  }

  return {
    async list() {
      const persisted = await repository.list()
      return persisted.map(parsePersistedTheme).map(summarizeTheme)
    },
    find,
    async create(input) {
      const theme = parseThemeDefinition(input)
      if (theme.ownership.ownerType === 'system') throw new ProtectedThemeError('System themes cannot be created through normal CRUD.')
      if (await repository.findById(theme.id)) throw new ThemeConflictError(`Theme '${theme.id}' already exists.`)
      await repository.save(serializeThemeDefinition(theme))
      return theme
    },
    async update(id, input) {
      const existing = await find(id)
      if (!existing) throw new ThemeNotFoundError(`Theme '${id}' was not found.`)
      if (existing.ownership.ownerType === 'system') throw new ProtectedThemeError('System themes cannot be modified.')
      const theme = parseThemeDefinition(input)
      if (theme.id !== id) throw new TypeError('Theme ID does not match the requested resource.')
      await repository.save(serializeThemeDefinition(theme))
      return theme
    },
    async delete(id) {
      const existing = await find(id)
      if (!existing) throw new ThemeNotFoundError(`Theme '${id}' was not found.`)
      if (existing.ownership.ownerType === 'system') throw new ProtectedThemeError('System themes cannot be deleted.')
      await repository.delete(id)
    },
  }
}
