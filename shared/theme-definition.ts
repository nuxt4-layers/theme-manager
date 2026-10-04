import type {
  JsonValue,
  ThemeDefinition,
  ThemeLifecycle,
  ThemeOwnership,
  ThemePresentation,
  ThemeVisibility,
} from '../contracts'
import { assertRuntimeTheme, runtimePresentationVariables } from './theme-runtime'

const VISIBILITY: readonly ThemeVisibility[] = ['private', 'group', 'organisation', 'shared', 'public', 'system']
const LIFECYCLE: readonly ThemeLifecycle[] = ['draft', 'published', 'archived']
const OWNER_TYPES = ['system', 'user', 'group', 'organisation'] as const
const THEME_ID = /^[a-z0-9-]{1,64}$/
const MAX_NAME_LENGTH = 128
const MAX_DESCRIPTION_LENGTH = 2048
const MAX_VERSION_LENGTH = 64
const MAX_SCHEMA_VERSION_LENGTH = 64
const MAX_MODES = 8
const MAX_ROLES_PER_MODE = 512

export class ThemeValidationError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

function validation(message: string): never {
  throw new ThemeValidationError(message)
}

function string(value: unknown, field: string, maxLength: number, optional = false): string | undefined {
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string' || !value.trim()) validation(`${field} must be a non-empty string.`)
  if (value.length > maxLength) validation(`${field} must not exceed ${maxLength} characters.`)
  return value
}

function ownership(value: unknown): ThemeOwnership {
  if (!isRecord(value) || !OWNER_TYPES.includes(value.ownerType as never)) {
    validation('ownership.ownerType is invalid.')
  }
  const ownerId = value.ownerId
  if (value.ownerType !== 'system' && (typeof ownerId !== 'string' || !ownerId.trim())) {
    validation('ownership.ownerId is required for non-system themes.')
  }
  if (typeof ownerId === 'string' && ownerId.length > 256) validation('ownership.ownerId must not exceed 256 characters.')
  return { ownerType: value.ownerType as ThemeOwnership['ownerType'], ...(ownerId ? { ownerId: String(ownerId) } : {}) }
}

function presentation(value: unknown): ThemePresentation {
  if (!isRecord(value)) validation('presentation must be an object.')
  const required = ['colour', 'typography', 'spacing', 'radii', 'effects', 'responsive', 'assets'] as const
  for (const key of required) if (!isRecord(value[key])) validation(`presentation.${key} must be an object.`)
  return value as unknown as ThemePresentation
}

function validateRuntimeContent(theme: ThemeDefinition): void {
  if (Object.keys(theme.modes).length > MAX_MODES) validation(`modes must not contain more than ${MAX_MODES} entries.`)
  for (const [mode, roles] of Object.entries(theme.modes)) {
    if (!isRecord(roles)) validation(`modes.${mode} must be an object.`)
    if (Object.keys(roles).length > MAX_ROLES_PER_MODE) {
      validation(`modes.${mode} must not contain more than ${MAX_ROLES_PER_MODE} roles.`)
    }
  }

  try {
    assertRuntimeTheme({ id: theme.id, name: theme.name, modes: theme.modes })
    runtimePresentationVariables(theme.presentation)
  }
  catch (error) {
    if (error instanceof Error) validation(error.message)
    validation('Theme runtime content is invalid.')
  }
}

export function parseThemeDefinition(value: unknown): ThemeDefinition {
  if (!isRecord(value)) validation('Theme Definition must be an object.')

  const visibility = value.visibility
  const lifecycle = value.lifecycle
  if (!VISIBILITY.includes(visibility as ThemeVisibility)) validation('visibility is invalid.')
  if (!LIFECYCLE.includes(lifecycle as ThemeLifecycle)) validation('lifecycle is invalid.')
  if (!isRecord(value.modes)) validation('modes must be an object.')

  const id = string(value.id, 'id', 64)!
  if (!THEME_ID.test(id)) validation('id must contain only lowercase letters, numbers and hyphens, with a maximum length of 64.')

  const theme: ThemeDefinition = {
    id,
    name: string(value.name, 'name', MAX_NAME_LENGTH)!,
    ...(value.description === undefined ? {} : { description: string(value.description, 'description', MAX_DESCRIPTION_LENGTH) }),
    version: string(value.version, 'version', MAX_VERSION_LENGTH)!,
    schemaVersion: string(value.schemaVersion, 'schemaVersion', MAX_SCHEMA_VERSION_LENGTH)!,
    ...(value.created === undefined ? {} : { created: string(value.created, 'created', 128) }),
    ...(value.updated === undefined ? {} : { updated: string(value.updated, 'updated', 128) }),
    ownership: ownership(value.ownership),
    visibility: visibility as ThemeVisibility,
    lifecycle: lifecycle as ThemeLifecycle,
    presentation: presentation(value.presentation),
    modes: value.modes as ThemeDefinition['modes'],
  }

  validateRuntimeContent(theme)
  return theme
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
