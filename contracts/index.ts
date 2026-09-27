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
  ownership: ThemeOwnership
  visibility: ThemeVisibility
  lifecycle: ThemeLifecycle
}

export interface ThemeRepository {
  findById(id: string): Promise<JsonValue | null>
  list(): Promise<readonly JsonValue[]>
  save(serializedTheme: JsonValue): Promise<void>
  delete(id: string): Promise<void>
}
