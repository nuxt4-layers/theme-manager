import { describe, expect, it } from 'vitest'
import type {
  JsonValue,
  ThemeActorContext,
  ThemeAuthorizationRequest,
  ThemeAuthorizationService,
  ThemeDefinition,
  ThemeRepository,
} from '../contracts'
import { serializeThemeDefinition } from '../shared/theme-definition'
import { createThemeService } from '../server/utils/theme-service'
import { ThemeAuthorizationError, type ThemeAccessIntegration } from '../server/utils/theme-access'

const theme = (id: string, ownerId: string): ThemeDefinition => ({
  id, name: id, version: '1', schemaVersion: '1',
  ownership: { ownerType: 'user', ownerId },
  visibility: 'private', lifecycle: 'draft',
  presentation: { colour: {}, typography: { families: {}, sizes: {}, weights: {} }, spacing: {}, radii: {}, effects: { shadow: {}, insetShadow: {}, dropShadow: {}, textShadow: {} }, responsive: { breakpoints: {}, containers: {} }, assets: {} },
  modes: { light: { pen: { default: '#000', hover: '#111', active: '#222', selected: '#333', visited: '#444', disabled: '#555' } }, dark: { pen: { default: '#000', hover: '#111', active: '#222', selected: '#333', visited: '#444', disabled: '#555' } } },
})

function repository(initial: ThemeDefinition[]): ThemeRepository {
  const values = new Map<string, JsonValue>(initial.map(t => [t.id, serializeThemeDefinition(t)]))
  return {
    findById: async id => values.get(id) ?? null,
    list: async () => [...values.values()],
    save: async value => { const id = (value as { id: string }).id; values.set(id, value) },
    delete: async id => { values.delete(id) },
  }
}

const actor: ThemeActorContext = { actorId: 'user-a', groupIds: ['group-a'], organisationIds: ['org-a'] }

function access(allowed: (request: ThemeAuthorizationRequest) => boolean): ThemeAccessIntegration {
  return {
    actor: async () => actor,
    async assert(action, resource) {
      const request = { actor, action, resource }
      if (!allowed(request)) throw new ThemeAuthorizationError(action, resource.resourceId)
      return actor
    },
  }
}

describe('TM-8 Identity and Authorization integration', () => {
  it('filters Theme library results through authoritative read decisions', async () => {
    const service = createThemeService(repository([theme('mine', 'user-a'), theme('other', 'user-b')]),
      access(req => req.resource.ownership?.ownerId === req.actor.actorId))
    expect((await service.list()).map(t => t.id)).toEqual(['mine'])
  })

  it('does not disclose unauthorized resource existence on lookup', async () => {
    const service = createThemeService(repository([theme('other', 'user-b')]), access(() => false))
    expect(await service.find('other')).toBeNull()
  })

  it('enforces create, edit and delete as distinct Theme actions', async () => {
    const seen: string[] = []
    const authorization: ThemeAuthorizationService = {
      async isAllowed(request) { seen.push(request.action); return true },
    }
    const integrated: ThemeAccessIntegration = {
      actor: async () => actor,
      async assert(action, resource) {
        const request = { actor, action, resource }
        if (!await authorization.isAllowed(request)) throw new ThemeAuthorizationError(action, resource.resourceId)
        return actor
      },
    }
    const service = createThemeService(repository([theme('existing', 'user-a')]), integrated)
    await service.create(theme('created', 'user-a'))
    await service.update('existing', { ...theme('existing', 'user-a'), name: 'changed' })
    await service.delete('existing')
    expect(seen).toEqual(['theme.create', 'theme.edit', 'theme.delete'])
  })

  it('requires publish and share authority for privileged transitions', async () => {
    const seen: string[] = []
    const service = createThemeService(repository([theme('existing', 'user-a')]), access((request) => {
      seen.push(request.action)
      return true
    }))
    await service.update('existing', { ...theme('existing', 'user-a'), lifecycle: 'published', visibility: 'public' })
    expect(seen).toEqual(['theme.edit', 'theme.publish', 'theme.share'])
  })

  it('rejects creation for ownership the actor does not hold', async () => {
    const service = createThemeService(repository([]), access(() => true))
    await expect(service.create(theme('forged', 'user-b'))).rejects.toBeInstanceOf(ThemeAuthorizationError)
  })

  it('authorizes creation before revealing duplicate identifiers', async () => {
    const seen: string[] = []
    const service = createThemeService(repository([theme('existing', 'user-a')]), access((request) => {
      seen.push(request.action)
      return false
    }))
    await expect(service.create(theme('existing', 'user-a'))).rejects.toBeInstanceOf(ThemeAuthorizationError)
    expect(seen).toEqual(['theme.create'])
  })

  it('does not hide non-authorization failures while listing', async () => {
    const service = createThemeService(repository([theme('existing', 'user-a')]), {
      actor: async () => actor,
      async assert() { throw new Error('provider unavailable') },
    })
    await expect(service.list()).rejects.toThrow('provider unavailable')
  })

  it('hides resource existence from unauthorized readers', async () => {
    const service = createThemeService(repository([theme('other', 'user-b')]), access(() => false))
    expect(await service.find('other')).toBeNull()
    expect(await service.find('missing')).toBeNull()
  })

  it('prevents ownership transfer through ordinary edit', async () => {
    const service = createThemeService(repository([theme('owned', 'user-a')]), access(() => true))
    await expect(service.update('owned', theme('owned', 'user-b'))).rejects.toThrow(/ownership/)
  })

  it('keeps group membership opaque to Theme Manager', () => {
    expect(actor.groupIds).toEqual(['group-a'])
    expect(actor).not.toHaveProperty('memberships')
    expect(actor).not.toHaveProperty('roles')
  })
})
