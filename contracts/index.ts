export type ThemeOwnerType = 'system' | 'user' | 'group' | 'organisation'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type ThemeVisibility =
  | 'private'
  | 'group'
  | 'organisation'
  | 'shared'
  | 'public'
  | 'system'

export type ThemeLifecycle = 'draft' | 'published' | 'archived'

export type ThemeMode = 'light' | 'dark' | (string & {})

export type ThemeAction =
  | 'theme.read'
  | 'theme.create'
  | 'theme.edit'
  | 'theme.delete'
  | 'theme.use'
  | 'theme.publish'
  | 'theme.share'
  | 'theme.import'
  | 'theme.export'
  | 'theme.assign'

export interface ThemeOwnership {
  ownerType: ThemeOwnerType
  ownerId?: string
}

export interface ThemeAssetReference {
  assetId: string
  mediaType?: string
}

export interface ThemePresentation {
  colour: Record<string, unknown>
  typography: Record<string, unknown>
  spacing: Record<string, unknown>
  radii: Record<string, unknown>
  effects: Record<string, unknown>
  responsive: Record<string, unknown>
  /** Border, focus outline and ring widths; optional, the bundled defaults apply when absent. */
  borders?: Record<string, unknown>
  /** Easing curves, durations and animation shorthands; optional, the bundled defaults apply when absent. */
  motion?: Record<string, unknown>
  assets: Record<string, ThemeAssetReference>
}

export interface ThemeDefinition {
  id: string
  name: string
  description?: string
  version: string
  schemaVersion: string
  created?: string
  updated?: string
  ownership: ThemeOwnership
  visibility: ThemeVisibility
  lifecycle: ThemeLifecycle
  presentation: ThemePresentation
  modes: Record<ThemeMode, Record<string, unknown>>
}

export interface ThemeSummary {
  id: string
  name: string
  description?: string
  /** The Theme's own version; for a system Theme, the Theme Manager release it ships in. */
  version: string
  ownership: ThemeOwnership
  visibility: ThemeVisibility
  lifecycle: ThemeLifecycle
}

export interface ThemeActorContext {
  actorId: string | null
  groupIds: readonly string[]
  organisationIds: readonly string[]
}

export interface ThemeResourceRef {
  resourceType: 'theme'
  resourceId: string
  ownership?: ThemeOwnership
  visibility?: ThemeVisibility
}

export interface ThemeAuthorizationRequest {
  actor: ThemeActorContext
  action: ThemeAction
  resource: ThemeResourceRef
}

export interface ThemeAuthorizationService {
  isAllowed(request: ThemeAuthorizationRequest): Promise<boolean>
}

export interface ThemeActorContextProvider {
  getActorContext(): Promise<ThemeActorContext>
}

export interface ThemeRepository {
  findById(id: string): Promise<JsonValue | null>
  list(): Promise<readonly JsonValue[]>
  save(serializedTheme: JsonValue): Promise<void>
  delete(id: string): Promise<void>
}

export type {
  RuntimeTheme,
  RuntimeThemeMode,
  RuntimeInteractionState,
  RuntimeThemePresentation,
  ThemeApplication,
  ThemeStyleTarget,
} from '../shared/theme-runtime'

export {
  THEME_MODES,
  THEME_INTERACTION_STATES,
  assertRuntimeTheme,
  createThemeApplication,
  legacyColourThemeToRuntime,
  runtimePresentationVariables,
  runtimeVariableName,
  themeDefinitionToRuntime,
} from '../shared/theme-runtime'

export {
  parsePersistedTheme,
  parseThemeDefinition,
  serializeThemeDefinition,
  summarizeTheme,
} from '../shared/theme-definition'

export {
  CANONICAL_THEME_CARDINALITY,
  assertCompleteThemeVocabulary,
  completeThemeVocabulary,
  createCanonicalThemeDefinition,
  themeVocabularyCardinality,
} from '../shared/canonical-theme'
