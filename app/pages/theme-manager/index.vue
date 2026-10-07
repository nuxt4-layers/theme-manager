<template>
  <ThemeManagerThemeLibrary
    :themes="themes"
    :selected-theme-id="runtime.selectedThemeId.value"
    :storage="storage"
    :loading="loading"
    :error="error"
    @create="navigateTo('/theme-manager/new')"
    @edit="id => navigateTo(`/theme-manager/${encodeURIComponent(id)}`)"
    @select="selectTheme"
    @select-default="runtime.useDefault()"
  />
</template>

<script setup lang="ts">
import type { ThemeSummary } from '../../../contracts'
import { themeDefinitionToRuntime } from '../../../shared/theme-runtime'

const management = useThemeManagement()
const runtime = useThemeRuntime()
const { storage } = await useThemeCapabilities()
const themes = ref<ThemeSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function refresh() {
  // Without storage only the built-in default exists; there is nothing to list.
  if (!storage.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    themes.value = await management.listThemes()
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to load themes.'
  }
  finally {
    loading.value = false
  }
}

async function selectTheme(id: string) {
  try {
    const theme = await management.loadTheme(id)
    runtime.activate(themeDefinitionToRuntime(theme))
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to select theme.'
  }
}

await refresh()
</script>
