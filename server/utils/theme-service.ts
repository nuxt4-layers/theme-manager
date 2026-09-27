import type { ThemeDefinition, ThemeRepository, ThemeSummary } from '../../contracts'
import { parsePersistedTheme, parseThemeDefinition, serializeThemeDefinition, summarizeTheme } from '../../shared/theme-definition'
import type { ThemeAccessIntegration } from './theme-access'
import { themeResource } from './theme-access'

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

export function createThemeService(repository: ThemeRepository, access?: ThemeAccessIntegration): ThemeService {
  const rawFind = async (id: string) => {
    const persisted = await repository.findById(id)
    return persisted === null ? null : parsePersistedTheme(persisted)
  }

  const find = async (id: string) => {
    const theme = await rawFind(id)
    if (theme && access) await access.assert('theme.read', themeResource(theme))
    return theme
  }

  return {
    async list() {
      const persisted = await repository.list()
      const themes = persisted.map(parsePersistedTheme)
      if (!access) return themes.map(summarizeTheme)

      const visible: ThemeSummary[] = []
      for (const theme of themes) {
        try {
          await access.assert('theme.read', themeResource(theme))
          visible.push(summarizeTheme(theme))
        }
        catch {
          // Listing is a projection: resources the actor cannot read are omitted.
        }
      }
      return visible
    },
    find,
    async create(input) {
      const theme = parseThemeDefinition(input)
      if (theme.ownership.ownerType === 'system') throw new ProtectedThemeError('System themes cannot be created through normal CRUD.')
      if (await repository.findById(theme.id)) throw new ThemeConflictError(`Theme '${theme.id}' already exists.`)
      if (access) await access.assert('theme.create', themeResource(theme))
      await repository.save(serializeThemeDefinition(theme))
      return theme
    },
    async update(id, input) {
      const existing = await rawFind(id)
      if (!existing) throw new ThemeNotFoundError(`Theme '${id}' was not found.`)
      if (existing.ownership.ownerType === 'system') throw new ProtectedThemeError('System themes cannot be modified.')
      if (access) await access.assert('theme.edit', themeResource(existing))
      const theme = parseThemeDefinition(input)
      if (theme.id !== id) throw new TypeError('Theme ID does not match the requested resource.')
      if (
        theme.ownership.ownerType !== existing.ownership.ownerType
        || theme.ownership.ownerId !== existing.ownership.ownerId
      ) throw new TypeError('Theme ownership cannot be changed through the edit operation.')
      await repository.save(serializeThemeDefinition(theme))
      return theme
    },
    async delete(id) {
      const existing = await rawFind(id)
      if (!existing) throw new ThemeNotFoundError(`Theme '${id}' was not found.`)
      if (existing.ownership.ownerType === 'system') throw new ProtectedThemeError('System themes cannot be deleted.')
      if (access) await access.assert('theme.delete', themeResource(existing))
      await repository.delete(id)
    },
  }
}
