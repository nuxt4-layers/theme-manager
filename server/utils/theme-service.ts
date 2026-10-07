import type { ThemeActorContext, ThemeDefinition, ThemeOwnership, ThemeRepository, ThemeSummary } from '../../contracts'
import { parsePersistedTheme, parseThemeDefinition, serializeThemeDefinition, summarizeTheme } from '../../shared/theme-definition'
import { stampVocabulary, upgradeStoredTheme } from '../../shared/theme-version'
import type { ThemeAccessIntegration } from './theme-access'
import { ThemeAuthorizationError, themeResource } from './theme-access'

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

function actorOwns(actor: ThemeActorContext, ownership: ThemeOwnership): boolean {
  if (!ownership.ownerId || ownership.ownerType === 'system') return false
  if (ownership.ownerType === 'user') return actor.actorId === ownership.ownerId
  if (ownership.ownerType === 'group') return actor.groupIds.includes(ownership.ownerId)
  return actor.organisationIds.includes(ownership.ownerId)
}

function assertMutableTheme(theme: ThemeDefinition): void {
  if (theme.ownership.ownerType === 'system' || theme.visibility === 'system') {
    throw new ProtectedThemeError('System themes cannot be created or modified through normal CRUD.')
  }
}

export function createThemeService(repository: ThemeRepository, access?: ThemeAccessIntegration): ThemeService {
  const rawFind = async (id: string) => {
    const persisted = await repository.findById(id)
    return persisted === null ? null : upgradeStoredTheme(parsePersistedTheme(persisted))
  }

  const find = async (id: string) => {
    const theme = await rawFind(id)
    if (theme && access) {
      try {
        await access.assert('theme.read', themeResource(theme))
      }
      catch (error) {
        if (error instanceof ThemeAuthorizationError) return null
        throw error
      }
    }
    return theme
  }

  return {
    async list() {
      const persisted = await repository.list()
      const themes = persisted.map(value => upgradeStoredTheme(parsePersistedTheme(value)))
      if (!access) return themes.map(summarizeTheme)

      const visible: ThemeSummary[] = []
      for (const theme of themes) {
        try {
          await access.assert('theme.read', themeResource(theme))
          visible.push(summarizeTheme(theme))
        }
        catch (error) {
          if (!(error instanceof ThemeAuthorizationError)) throw error
        }
      }
      return visible
    },
    find,
    async create(input) {
      // Saved complete in this release's vocabulary, and stamped with it.
      const theme = stampVocabulary(parseThemeDefinition(input))
      assertMutableTheme(theme)

      if (access) {
        const actor = await access.assert('theme.create', themeResource(theme))
        if (!actorOwns(actor, theme.ownership)) {
          throw new ThemeAuthorizationError('theme.create', theme.id)
        }
        if (theme.lifecycle === 'published') await access.assert('theme.publish', themeResource(theme))
        if (theme.visibility !== 'private') await access.assert('theme.share', themeResource(theme))
      }

      if (await repository.findById(theme.id)) throw new ThemeConflictError(`Theme '${theme.id}' already exists.`)
      await repository.save(serializeThemeDefinition(theme))
      return theme
    },
    async update(id, input) {
      const existing = await rawFind(id)
      if (!existing) throw new ThemeNotFoundError(`Theme '${id}' was not found.`)
      assertMutableTheme(existing)
      if (access) await access.assert('theme.edit', themeResource(existing))

      // Saved complete in this release's vocabulary, and stamped with it.
      const theme = stampVocabulary(parseThemeDefinition(input))
      assertMutableTheme(theme)
      if (theme.id !== id) throw new ThemeNotFoundError('Theme ID does not match the requested resource.')
      if (
        theme.ownership.ownerType !== existing.ownership.ownerType
        || theme.ownership.ownerId !== existing.ownership.ownerId
      ) throw new ProtectedThemeError('Theme ownership cannot be changed through the edit operation.')

      if (access) {
        if (existing.lifecycle !== 'published' && theme.lifecycle === 'published') {
          await access.assert('theme.publish', themeResource(theme))
        }
        if (theme.visibility !== existing.visibility) {
          await access.assert('theme.share', themeResource(theme))
        }
      }

      await repository.save(serializeThemeDefinition(theme))
      return theme
    },
    async delete(id) {
      const existing = await rawFind(id)
      if (!existing) throw new ThemeNotFoundError(`Theme '${id}' was not found.`)
      assertMutableTheme(existing)
      if (access) await access.assert('theme.delete', themeResource(existing))
      await repository.delete(id)
    },
  }
}
