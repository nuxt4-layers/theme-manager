<template>
  <section v-if="readOnlyReason" class="mx-auto max-w-3xl space-y-step-sm px-step-md py-step-lg" aria-labelledby="theme-read-only-title">
    <h1 id="theme-read-only-title" class="text-title font-bold text-pen-base-default">{{ readOnlyReason.title }}</h1>
    <p role="note" class="rounded-card border border-edge-info-default bg-fill-info-default p-step-sm text-label text-pen-info-default">{{ readOnlyReason.body }}</p>
    <NuxtLink to="/theme-manager" class="inline-block rounded-control border border-edge-base-default bg-fill-base-default px-step-sm py-step-2xs text-label text-pen-base-default transition-[background-color,border-color,color] hover:bg-fill-base-hover focus-visible:outline-focus focus-visible:outline-offset-focus focus-visible:outline-edge-base-focus">Back to the Theme Library</NuxtLink>
  </section>
  <p v-else-if="pending" role="status" class="p-8 text-pen-muted-default">Loading theme…</p>
  <div v-else-if="error && !theme" role="alert" class="m-8 rounded-lg border border-edge-error-default bg-fill-error-default p-4 text-pen-error-default">{{ error }}</div>
  <ThemeManagerThemeEditor
    v-else-if="theme"
    ref="editor"
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
  <ThemeManagerThemeConfirmDialog ref="dialog" />
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'
import type { ConfirmRequest } from '../../components/theme-manager/ThemeConfirmDialog.vue'
import { assertCompleteThemeVocabulary, completeThemeVocabulary } from '../../../shared/canonical-theme'

const route = useRoute()
const management = useThemeManagement()
const { storage } = await useThemeCapabilities()
const id = computed(() => String(route.params.id))
const isNew = computed(() => id.value === 'new')
const pending = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const theme = ref<ThemeDefinition | null>(null)
const editor = ref<{ dirty: boolean } | null>(null)
const dialog = ref<{ ask: (request: ConfirmRequest) => Promise<boolean> } | null>(null)
// Set once a save or delete has finished, so leaving afterwards is not questioned.
let settled = false

async function newTheme(): Promise<ThemeDefinition> {
  const config = useRuntimeConfig().public.themeManager as {
    creationTemplateId?: string
    creationOwnerType?: 'user' | 'group' | 'organisation'
    creationOwnerId?: string
  } | undefined

  if (!config?.creationTemplateId || !config.creationOwnerType || !config.creationOwnerId) {
    throw new Error('Theme creation requires composition-supplied template and owner context.')
  }

  const template = completeThemeVocabulary(structuredClone(await management.loadTheme(config.creationTemplateId)))
  const now = new Date().toISOString()
  return {
    ...template,
    id: `theme-${crypto.randomUUID()}`,
    name: 'Untitled Theme',
    version: '1.0.0',
    created: now,
    updated: now,
    ownership: { ownerType: config.creationOwnerType, ownerId: config.creationOwnerId },
    visibility: 'private',
    lifecycle: 'draft',
  }
}

// Nothing can be saved without storage, and system themes ship with a release: neither
// opens the editor. The server enforces the same (503 and 403).
const isSystem = computed(() => theme.value?.ownership.ownerType === 'system' || theme.value?.visibility === 'system')
const readOnlyReason = computed(() => {
  if (!storage.value) return { title: 'Themes cannot be edited here', body: 'No theme store is configured, so themes cannot be created, edited or saved. The built-in default theme is in use.' }
  if (isSystem.value) return { title: `${theme.value!.name} is read-only`, body: 'System themes ship with a release of Theme Manager and cannot be edited. Create a theme to make your own.' }
  return null
})

onMounted(async () => {
  if (!storage.value) {
    pending.value = false
    return
  }
  try {
    theme.value = isNew.value ? await newTheme() : await management.loadTheme(id.value)
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
    if (isNew.value) await management.createTheme(assertCompleteThemeVocabulary(next))
    else await management.updateTheme(next)
    settled = true
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
  const confirmed = await dialog.value?.ask({
    title: `Delete ${theme.value.name}?`,
    body: 'The Theme is removed for everyone who uses it. This cannot be undone.',
    confirm: 'Delete Theme',
    cancel: 'Keep Theme',
    danger: true,
  })
  if (!confirmed) return
  try {
    await management.deleteTheme(theme.value.id)
    settled = true
    management.stopPreview()
    await navigateTo('/theme-manager')
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Failed to delete theme.'
  }
}

async function cancel() {
  await navigateTo('/theme-manager')
}

// Unsaved changes: leaving within the app asks first; closing or reloading the tab gets
// the browser's own prompt (the only one a page may show there).
onBeforeRouteLeave(async () => {
  if (!settled && editor.value?.dirty) {
    const leave = await dialog.value?.ask({
      title: 'Discard unsaved changes?',
      body: 'This Theme has changes that are not saved. Leaving now discards them.',
      confirm: 'Discard changes',
      cancel: 'Keep editing',
      danger: true,
    })
    if (!leave) return false
  }
  management.stopPreview()
  return true
})

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (settled || !editor.value?.dirty) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))
</script>
