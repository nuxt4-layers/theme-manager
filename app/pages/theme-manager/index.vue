<template>
  <ThemeManagerThemeLibrary
    :themes="themes"
    :selected-theme-id="runtime.selectedThemeId.value"
    :loading="loading"
    :error="error"
    @create="navigateTo('/theme-manager/new')"
    @edit="id => navigateTo(`/theme-manager/${encodeURIComponent(id)}`)"
    @select="selectTheme"
  />
</template>

<script setup lang="ts">
import type { ThemeSummary } from '../../../contracts'

const management = useThemeManagement()
const runtime = useThemeRuntime()
const themes = ref<ThemeSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function refresh() {
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
    runtime.activate(legacyColourThemeToRuntime({ id: theme.id, name: theme.name, colors: theme.modes }))
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to select theme.'
  }
}

await refresh()
</script>
