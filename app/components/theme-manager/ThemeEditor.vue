<template>
  <section class="mx-auto max-w-6xl px-4 py-6" aria-labelledby="theme-editor-title">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-edge-base-default pb-4">
      <div>
        <p class="text-sm text-pen-muted-default">Theme Manager / Editor</p>
        <h1 id="theme-editor-title" class="text-2xl font-bold text-pen-base-default">{{ model.name || 'Untitled Theme' }}</h1>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded-lg border border-edge-base-default px-4 py-2 text-pen-base-default" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="rounded-lg border border-edge-primary-default bg-fill-primary-default px-4 py-2 font-bold text-pen-primary-default disabled:opacity-50" :disabled="saving || !!rawError || !!validationError" @click="save">Save</button>
      </div>
    </header>

    <div v-if="error" role="alert" class="mb-5 rounded-lg border border-edge-error-default bg-fill-error-default p-4 text-pen-error-default">{{ error }}</div>
    <div v-if="validationError" role="alert" class="mb-5 rounded-card border border-edge-error-default bg-fill-error-default p-step-sm text-label text-pen-error-default">
      This draft cannot be saved yet: {{ validationError }} The preview shows the last valid version.
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <aside class="space-y-5">
        <fieldset class="rounded-xl border border-edge-base-default bg-fill-base-default p-5">
          <legend class="px-1 font-bold text-pen-base-default">General</legend>
          <label class="mb-4 block text-sm text-pen-muted-default">Name
            <input v-model="model.name" class="mt-1 w-full rounded-lg border border-edge-input-default bg-fill-input-default px-3 py-2 text-pen-base-default" />
          </label>
          <label class="block text-sm text-pen-muted-default">Description
            <textarea :value="model.description ?? ''" rows="3" @input="setDescription(($event.target as HTMLTextAreaElement).value)" class="mt-1 w-full rounded-lg border border-edge-input-default bg-fill-input-default px-3 py-2 text-pen-base-default" />
          </label>
        </fieldset>

        <fieldset class="rounded-xl border border-edge-base-default bg-fill-base-default p-5">
          <legend class="px-1 font-bold text-pen-base-default">Preview</legend>
          <p class="mb-3 text-xs text-pen-muted-default">The preview shows this draft; the rest of the page keeps the active theme.</p>
          <p id="preview-view-label" class="text-label text-pen-muted-default">View</p>
          <div class="mt-step-2xs flex gap-step-2xs" role="group" aria-labelledby="preview-view-label">
            <button v-for="view in previewViews" :key="view.id" type="button" class="flex-1 rounded-control border px-step-xs py-step-2xs text-label" :aria-pressed="previewView === view.id" :class="previewView === view.id ? 'border-edge-primary-selected bg-fill-primary-selected text-pen-primary-selected' : 'border-edge-base-default bg-fill-base-default text-pen-base-default'" @click="previewView = view.id">{{ view.label }}</button>
          </div>
          <p id="editing-mode-label" class="mt-step-sm text-label text-pen-muted-default">Colours being edited</p>
          <div class="mt-step-2xs flex gap-step-2xs" role="group" aria-labelledby="editing-mode-label">
            <button v-for="mode in ['light', 'dark'] as const" :key="mode" type="button" class="flex-1 rounded-control border px-step-xs py-step-2xs text-label capitalize" :aria-pressed="editingMode === mode" :class="editingMode === mode ? 'border-edge-primary-selected bg-fill-primary-selected text-pen-primary-selected' : 'border-edge-base-default bg-fill-base-default text-pen-base-default'" @click="editingMode = mode">{{ mode }}</button>
          </div>
          <label class="mt-step-sm flex items-start gap-step-xs text-label text-pen-base-default">
            <input v-model="applyToApp" type="checkbox" class="mt-step-3xs">
            <span>Apply to the whole app while editing</span>
          </label>
        </fieldset>

        <button v-if="!isNew && model.ownership.ownerType !== 'system'" type="button" class="w-full rounded-lg border border-edge-error-default bg-fill-error-default px-4 py-2 text-pen-error-default" @click="$emit('delete')">Delete Theme</button>
      </aside>

      <main class="lg:col-span-2">
        <section class="mb-step-md grid gap-step-sm" :class="previewView === 'both' ? 'xl:grid-cols-2' : ''" aria-label="Draft preview">
          <ThemeManagerThemePreviewScope
            v-for="mode in previewModes"
            :key="mode"
            :theme="preview"
            :mode="mode"
            class="overflow-hidden rounded-panel border border-edge-base-default"
          >
            <p class="px-step-md pt-step-sm text-caption capitalize">{{ mode }}</p>
            <ThemeManagerThemePreviewSpecimen @edit-role="editRole" />
          </ThemeManagerThemePreviewScope>
        </section>

        <div class="mb-4 flex gap-2 overflow-x-auto border-b border-edge-base-default" role="tablist" aria-label="Theme editor sections">
          <button v-for="tab in tabs" :key="tab" type="button" role="tab" class="whitespace-nowrap border-b-2 px-3 py-2 capitalize" :aria-selected="activeTab === tab" :class="activeTab === tab ? 'border-edge-primary-default bg-fill-primary-default font-medium text-pen-primary-default' : 'border-transparent text-pen-muted-default'" @click="activeTab = tab">{{ tab }}</button>
        </div>

        <ThemeManagerThemeEditorColours
          v-if="activeTab === 'colours'"
          ref="coloursSection"
          v-model:role="colourRole"
          :modes="colourModes"
          :editing-mode="editingMode"
          :preview="preview"
          :preview-modes="previewModes"
          @set="draft.setColour"
        />

        <ThemeManagerThemeEditorShadows
          v-else-if="activeTab === 'shadows'"
          :effects="model.presentation.effects"
          :modes="colourModes"
          :editing-mode="editingMode"
          :preview="preview"
          :preview-modes="previewModes"
          @set-value="draft.setPresentationValue"
          @set-colour="draft.setColour"
        />

        <ThemeManagerThemeEditorTypography
          v-else-if="activeTab === 'typography'"
          :typography="model.presentation.typography as never"
          :preview="preview"
          :preview-modes="previewModes"
          @set-value="draft.setPresentationValue"
        />

        <ThemeManagerThemeEditorScales
          v-else-if="scaleTab"
          :key="scaleTab"
          :theme="model"
          :section="scaleTab"
          :preview="preview"
          :preview-modes="previewModes"
          @set-value="draft.setPresentationValue"
        />

        <div v-else-if="activeTab === 'raw'">
          <label class="sr-only" for="theme-raw-json">Theme Definition JSON</label>
          <textarea id="theme-raw-json" :value="raw" rows="30" spellcheck="false" class="w-full rounded-xl border border-edge-base-default bg-fill-base-default p-4 font-mono text-xs text-pen-base-default" @input="applyRaw(($event.target as HTMLTextAreaElement).value)" />
          <p v-if="rawError" role="alert" class="mt-2 rounded border border-edge-error-default bg-fill-error-default p-2 text-sm text-pen-error-default">{{ rawError }}</p>
          <button type="button" class="mt-2 text-sm text-pen-primary-default" @click="formatRaw">Format JSON</button>
        </div>

        <ThemeManagerThemeEditorEffects
          v-else-if="activeTab === 'effects'"
          :theme="model"
          :preview="preview"
          :preview-modes="previewModes"
          @set-value="draft.setPresentationValue"
        />

        <ThemeManagerThemeEditorMotion
          v-else-if="activeTab === 'motion'"
          :theme="model"
          :preview="preview"
          :preview-modes="previewModes"
          @set-value="draft.setPresentationValue"
        />

        <ThemeManagerThemeEditorBreakpoints v-else-if="activeTab === 'responsive'" />

        <div v-else class="rounded-xl border border-edge-base-default bg-fill-base-default p-6">
          <p class="text-pen-muted-default">Semantic asset bindings are managed as asset references. Raw JSON remains available for bindings until an external asset provider is composed.</p>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'
import { useThemeDraft } from '../../composables/useThemeDraft'

const props = defineProps<{ theme: ThemeDefinition; isNew?: boolean; saving?: boolean; error?: string | null }>()
const emit = defineEmits<{ save: [theme: ThemeDefinition]; cancel: []; delete: []; preview: [theme: ThemeDefinition]; stopPreview: [] }>()

const draft = useThemeDraft(props.theme)
const { model, raw, rawError, validationError, preview, applyRaw, formatRaw } = draft
const activeTab = ref<'colours' | 'typography' | 'spacing' | 'radii' | 'borders' | 'shadows' | 'effects' | 'motion' | 'responsive' | 'assets' | 'raw'>('colours')
const tabs = ['colours', 'typography', 'spacing', 'radii', 'borders', 'shadows', 'effects', 'motion', 'responsive', 'assets', 'raw'] as const
// Which mode's colours the Colours tab edits; the preview view is chosen separately.
const editingMode = ref<'light' | 'dark'>('light')
const previewViews = [
  { id: 'both', label: 'Side by side' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const
const previewView = ref<(typeof previewViews)[number]['id']>('both')
const previewModes = computed(() => (previewView.value === 'both' ? ['light', 'dark'] as const : [previewView.value]))
// Off by default: the draft stays inside the preview, so the editor itself keeps the
// active theme and a half-finished colour can never make it unreadable.
const applyToApp = ref(false)

const colourModes = computed(() => model.modes as Record<string, Record<string, Record<string, string>>>)

const SCALE_TABS = ['spacing', 'radii', 'borders'] as const
const scaleTab = computed(() => (SCALE_TABS as readonly string[]).includes(activeTab.value) ? activeTab.value as (typeof SCALE_TABS)[number] : null)

function setDescription(value: string) {
  // An empty description is no description: the definition rejects a blank string.
  if (value.trim()) model.description = value
  else delete model.description
}

// The Colours tab's selected role; a preview component's "colours" button opens it.
const colourRole = ref('accent')
const coloursSection = ref<{ focusMatrix: () => void } | null>(null)

async function editRole(role: string) {
  activeTab.value = 'colours'
  colourRole.value = role
  await nextTick()
  coloursSection.value?.focusMatrix()
}

// The whole-app preview uses the common runtime engine through the page. It follows the
// last valid definition, so it never re-validates (and never re-triggers itself).
watch([applyToApp, draft.definition], ([apply, definition]) => {
  if (apply && definition) emit('preview', definition)
  else if (!apply) emit('stopPreview')
})

function save() {
  const definition = draft.result()
  if (definition) emit('save', definition)
}

onBeforeUnmount(() => emit('stopPreview'))
</script>
