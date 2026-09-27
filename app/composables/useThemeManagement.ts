import type { ThemeDefinition, ThemeSummary } from '../../contracts'
import { parseThemeDefinition } from '../../shared/theme-definition'
import { legacyColourThemeToRuntime } from '../../shared/theme-runtime'

export function useThemeManagement() {
  const runtime = useThemeRuntime()

  async function listThemes(): Promise<ThemeSummary[]> {
    return await $fetch<ThemeSummary[]>('/api/themes')
  }

  async function loadTheme(id: string): Promise<ThemeDefinition> {
    return parseThemeDefinition(await $fetch<unknown>(`/api/themes/${encodeURIComponent(id)}`))
  }

  async function createTheme(theme: ThemeDefinition): Promise<void> {
    await $fetch('/api/themes', { method: 'POST', body: theme })
  }

  async function updateTheme(theme: ThemeDefinition): Promise<void> {
    await $fetch(`/api/themes/${encodeURIComponent(theme.id)}`, { method: 'PUT', body: theme })
  }

  async function deleteTheme(id: string): Promise<void> {
    await $fetch(`/api/themes/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (runtime.selectedThemeId.value === id) runtime.useDefault()
  }

  function previewTheme(theme: ThemeDefinition): void {
    runtime.preview(legacyColourThemeToRuntime({
      id: theme.id,
      name: theme.name,
      colors: theme.modes,
    }))
  }

  function stopPreview(): void {
    runtime.clearPreview()
  }

  return { listThemes, loadTheme, createTheme, updateTheme, deleteTheme, previewTheme, stopPreview }
}
