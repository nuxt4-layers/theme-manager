import { describe, expect, it } from 'vitest'
import type { JsonValue, ThemeDefinition, ThemeRepository } from '../contracts'
import { parsePersistedTheme, parseThemeDefinition, serializeThemeDefinition } from '../shared/theme-definition'
import {
  createThemeService,
  ProtectedThemeError,
  ThemeConflictError,
  ThemeNotFoundError,
} from '../server/utils/theme-service'

const makeTheme = (id = 'theme-a', ownerType: ThemeDefinition['ownership']['ownerType'] = 'user'): ThemeDefinition => ({
  id,
  name: 'Theme A',
  description: 'Test theme',
  version: '1.0.0',
  schemaVersion: '1',
  ownership: ownerType === 'system' ? { ownerType: 'system' } : { ownerType, ownerId: 'actor-1' },
  visibility: ownerType === 'system' ? 'system' : 'private',
  lifecycle: 'draft',
  presentation: {
    colour: {},
    typography: { families: {}, sizes: {}, weights: {} },
    spacing: {},
    radii: {},
    effects: { shadow: {}, insetShadow: {}, dropShadow: {}, textShadow: {} },
    responsive: { breakpoints: {}, containers: {} },
    assets: {},
  },
  modes: { light: { pen: { default: '#000', hover: '#111', active: '#222', selected: '#333', visited: '#444', disabled: '#555' } }, dark: { pen: { default: '#000', hover: '#111', active: '#222', selected: '#333', visited: '#444', disabled: '#555' } } },
})

function memoryRepository(initial: ThemeDefinition[] = []) {
  const values = new Map<string, JsonValue>(initial.map(theme => [theme.id, serializeThemeDefinition(theme)]))
  const repository: ThemeRepository = {
    async findById(id) { return values.get(id) ?? null },
    async list() { return [...values.values()] },
    async save(value) {
      const theme = parsePersistedTheme(value)
      values.set(theme.id, value)
    },
    async delete(id) { values.delete(id) },
  }
  return { repository, values }
}

describe('TM-6 Theme persistence and management', () => {
  it('round-trips the canonical JSON representation', () => {
    const theme = makeTheme()
    expect(parsePersistedTheme(serializeThemeDefinition(theme))).toEqual(theme)
  })

  it('rejects malformed Theme Definitions before persistence', () => {
    expect(() => parseThemeDefinition({ id: 'bad' })).toThrow()
  })

  it('treats malformed persisted JSON as invalid on read', async () => {
    const { repository, values } = memoryRepository()
    values.set('bad', { id: 'bad' })
    await expect(createThemeService(repository).find('bad')).rejects.toThrow()
  })

  it('creates, lists, reads, updates and deletes through the repository port', async () => {
    const { repository } = memoryRepository()
    const service = createThemeService(repository)
    await service.create(makeTheme())
    expect((await service.list()).map(theme => theme.id)).toEqual(['theme-a'])
    expect((await service.find('theme-a'))?.name).toBe('Theme A')

    const updated = { ...makeTheme(), name: 'Updated' }
    await service.update('theme-a', updated)
    expect((await service.find('theme-a'))?.name).toBe('Updated')

    await service.delete('theme-a')
    expect(await service.find('theme-a')).toBeNull()
  })

  it('preserves create conflict semantics', async () => {
    const { repository } = memoryRepository([makeTheme()])
    await expect(createThemeService(repository).create(makeTheme())).rejects.toBeInstanceOf(ThemeConflictError)
  })

  it('requires update/delete resources to exist', async () => {
    const { repository } = memoryRepository()
    const service = createThemeService(repository)
    await expect(service.update('missing', makeTheme('missing'))).rejects.toBeInstanceOf(ThemeNotFoundError)
    await expect(service.delete('missing')).rejects.toBeInstanceOf(ThemeNotFoundError)
  })

  it('protects canonical system Themes from normal CRUD mutation', async () => {
    const system = makeTheme('system-default', 'system')
    const { repository } = memoryRepository([system])
    const service = createThemeService(repository)
    await expect(service.create(makeTheme('new-system', 'system'))).rejects.toBeInstanceOf(ProtectedThemeError)
    await expect(service.update(system.id, system)).rejects.toBeInstanceOf(ProtectedThemeError)
    await expect(service.delete(system.id)).rejects.toBeInstanceOf(ProtectedThemeError)
  })

  it('does not allow resource identity to change during update', async () => {
    const { repository } = memoryRepository([makeTheme()])
    await expect(createThemeService(repository).update('theme-a', makeTheme('theme-b'))).rejects.toThrow(/ID/)
  })
})
