import type { RuntimeTheme } from '../../shared/theme-runtime'

export const DEFAULT_THEME_NAME = 'Default Theme'
export const ACTIVE_THEME_COOKIE = 'active-theme-id'

export function useThemeRuntime() {
  const selectedThemeId = useCookie<string | null>(ACTIVE_THEME_COOKIE, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  const activeTheme = useState<RuntimeTheme | null>('theme-manager:active-theme', () => null)
  const previewTheme = useState<RuntimeTheme | null>('theme-manager:preview-theme', () => null)
  const error = useState<string | null>('theme-manager:error', () => null)

  const effectiveTheme = computed(() => previewTheme.value ?? activeTheme.value)
  const hasActiveTheme = computed(() => activeTheme.value !== null)
  const activeThemeName = computed(() => activeTheme.value?.name ?? DEFAULT_THEME_NAME)

  function activate(theme: RuntimeTheme) {
    activeTheme.value = theme
    selectedThemeId.value = theme.id
    previewTheme.value = null
    error.value = null
  }

  function useDefault() {
    activeTheme.value = null
    previewTheme.value = null
    selectedThemeId.value = null
    error.value = null
  }

  function preview(theme: RuntimeTheme) {
    previewTheme.value = theme
    error.value = null
  }

  function clearPreview() {
    previewTheme.value = null
  }

  function failToDefault(reason?: unknown) {
    useDefault()
    if (reason) error.value = reason instanceof Error ? reason.message : String(reason)
  }

  return {
    selectedThemeId,
    activeTheme,
    previewTheme,
    effectiveTheme,
    error,
    hasActiveTheme,
    activeThemeName,
    activate,
    useDefault,
    preview,
    clearPreview,
    failToDefault,
  }
}
