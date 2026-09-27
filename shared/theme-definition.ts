import type {
  JsonValue,
  ThemeDefinition,
  ThemeLifecycle,
  ThemeOwnership,
  ThemePresentation,
  ThemeVisibility,
} from '../contracts'

const VISIBILITY: readonly ThemeVisibility[] = ['private', 'group', 'organisation', 'shared', 'public', 'system']
const LIFECYCLE: readonly ThemeLifecycle[] = ['draft', 'published', 'archived']
const OWNER_TYPES = ['system', 'user', 'group', 'organisation'] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

function string(value: unknown, field: string, optional = false): string | undefined {
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a non-empty string.`)
  return value
}

function ownership(value: unknown): ThemeOwnership {
  if (!isRecord(value) || !OWNER_TYPES.includes(value.ownerType as never)) {
    throw new TypeError('ownership.ownerType is invalid.')
  }
  const ownerId = value.ownerId
  if (value.ownerType !== 'system' && (typeof ownerId !== 'string' || !ownerId.trim())) {
    throw new TypeError('ownership.ownerId is required for non-system themes.')
  }
  return { ownerType: value.ownerType as ThemeOwnership['ownerType'], ...(ownerId ? { ownerId: String(ownerId) } : {}) }
}

function presentation(value: unknown): ThemePresentation {
  if (!isRecord(value)) throw new TypeError('presentation must be an object.')
  const required = ['colour', 'typography', 'spacing', 'radii', 'effects', 'responsive', 'assets'] as const
  for (const key of required) if (!isRecord(value[key])) throw new TypeError(`presentation.${key} must be an object.`)
  return value as unknown as ThemePresentation
}

export function parseThemeDefinition(value: unknown): ThemeDefinition {
  if (!isRecord(value)) throw new TypeError('Theme Definition must be an object.')

  const visibility = value.visibility
  const lifecycle = value.lifecycle
  if (!VISIBILITY.includes(visibility as ThemeVisibility)) throw new TypeError('visibility is invalid.')
  if (!LIFECYCLE.includes(lifecycle as ThemeLifecycle)) throw new TypeError('lifecycle is invalid.')
  if (!isRecord(value.modes)) throw new TypeError('modes must be an object.')

  return {
    id: string(value.id, 'id')!,
    name: string(value.name, 'name')!,
    ...(value.description === undefined ? {} : { description: string(value.description, 'description') }),
    version: string(value.version, 'version')!,
    schemaVersion: string(value.schemaVersion, 'schemaVersion')!,
    ...(value.created === undefined ? {} : { created: string(value.created, 'created') }),
    ...(value.updated === undefined ? {} : { updated: string(value.updated, 'updated') }),
    ownership: ownership(value.ownership),
    visibility: visibility as ThemeVisibility,
    lifecycle: lifecycle as ThemeLifecycle,
    presentation: presentation(value.presentation),
    modes: value.modes as ThemeDefinition['modes'],
  }
}

export function serializeThemeDefinition(theme: ThemeDefinition): JsonValue {
  return JSON.parse(JSON.stringify(parseThemeDefinition(theme))) as JsonValue
}

export function parsePersistedTheme(value: JsonValue): ThemeDefinition {
  return parseThemeDefinition(value)
}

export function summarizeTheme(theme: ThemeDefinition) {
  return {
    id: theme.id,
    name: theme.name,
    ...(theme.description === undefined ? {} : { description: theme.description }),
    ownership: theme.ownership,
    visibility: theme.visibility,
    lifecycle: theme.lifecycle,
  }
}
