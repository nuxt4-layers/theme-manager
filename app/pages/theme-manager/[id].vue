<template>
  <p v-if="pending" role="status" class="p-8 text-pen-muted-default">Loading theme…</p>
  <div v-else-if="error && !theme" role="alert" class="m-8 rounded-lg border border-edge-error-default p-4 text-pen-error-default">{{ error }}</div>
  <ThemeManagerThemeEditor
    v-else-if="theme"
    :theme="theme"
    :is-new="isNew"
    :saving="saving"
    :error="error"
    @save="save"
    @delete="remove"
    @cancel="cancel"
    @preview="management.previewTheme"
    @stop-preview="management.stopPreview"
  />
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'

const route = useRoute()
const management = useThemeManagement()
const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'new')
const pending = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const theme = ref<ThemeDefinition | null>(null)

function newTheme(): ThemeDefinition {
  const now = new Date().toISOString()
  return {
    id: `theme-${crypto.randomUUID()}`,
    name: 'Untitled Theme',
    description: '',
    version: '1.0.0',
    schemaVersion: '1',
    created: now,
    updated: now,
    ownership: { ownerType: 'user', ownerId: 'unassigned' },
    visibility: 'private',
    lifecycle: 'draft',
    presentation: { colour: {}, typography: {}, spacing: {}, radii: {}, effects: {}, responsive: {}, assets: {} },
    modes: { light: {}, dark: {} },
  }
}

onMounted(async () => {
  try {
    theme.value = isNew.value ? newTheme() : await management.loadTheme(id.value)
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to load theme.'
  }
  finally {
    pending.value = false
  }
})

async function save(next: ThemeDefinition) {
  saving.value = true
  error.value = null
  try {
    next.updated = new Date().toISOString()
    if (isNew.value) await management.createTheme(next)
    else await management.updateTheme(next)
    management.stopPreview()
    await navigateTo('/theme-manager')
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to save theme.'
  }
  finally {
    saving.value = false
  }
}

async function remove() {
  if (!theme.value || isNew.value) return
  if (!confirm(`Delete "${theme.value.name}"? This cannot be undone.`)) return
  try {
    await management.deleteTheme(theme.value.id)
    management.stopPreview()
    await navigateTo('/theme-manager')
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to delete theme.'
  }
}

async function cancel() {
  management.stopPreview()
  await navigateTo('/theme-manager')
}
</script>
