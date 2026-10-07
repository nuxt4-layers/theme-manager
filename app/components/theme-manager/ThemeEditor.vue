<template>
  <section class="mx-auto max-w-7xl px-step-md py-step-lg" aria-labelledby="theme-editor-title">
    <header class="mb-step-lg flex flex-wrap items-center justify-between gap-step-md border-b border-edge-base-default pb-step-md">
      <div>
        <p class="text-label text-pen-muted-default">Theme Manager / Editor</p>
        <h1 id="theme-editor-title" class="text-title font-bold text-pen-base-default">{{ model.name || 'Untitled Theme' }}</h1>
      </div>
      <div class="flex gap-step-xs">
        <button type="button" class="rounded-control border px-step-sm py-step-2xs text-label transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:outline-offset-focus border-edge-base-default bg-fill-base-default text-pen-base-default hover:bg-fill-base-hover focus-visible:outline-edge-base-focus" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="rounded-control border px-step-sm py-step-2xs text-label transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:outline-offset-focus border-edge-primary-default bg-fill-primary-default font-bold text-pen-primary-default hover:border-edge-primary-hover hover:bg-fill-primary-hover hover:text-pen-primary-hover focus-visible:outline-edge-primary-focus disabled:border-edge-primary-disabled disabled:bg-fill-primary-disabled disabled:text-pen-primary-disabled" :disabled="saving || !!rawError || !!validationError" @click="save">Save</button>
      </div>
    </header>

    <div v-if="error" role="alert" class="mb-step-md rounded-card border border-edge-error-default bg-fill-error-default p-step-sm text-label text-pen-error-default">{{ error }}</div>
    <div v-if="validationError" role="alert" class="mb-step-md rounded-card border border-edge-error-default bg-fill-error-default p-step-sm text-label text-pen-error-default">
      This draft cannot be saved yet: {{ validationError }} The preview shows the last valid version.
    </div>

    <div class="grid gap-step-lg lg:grid-cols-3">
      <div class="space-y-step-md">
        <fieldset class="rounded-panel border border-edge-base-default bg-fill-base-default p-step-md">
          <legend class="px-step-3xs font-bold text-pen-base-default">General</legend>
          <label class="mb-step-sm block text-label text-pen-muted-default">Name
            <input v-model="model.name" class="mt-step-3xs w-full rounded-control border border-edge-input-default bg-fill-input-default px-step-xs py-step-2xs text-body text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus" />
          </label>
          <label class="block text-label text-pen-muted-default">Description
            <textarea :value="model.description ?? ''" rows="3" @input="setDescription(($event.target as HTMLTextAreaElement).value)" class="mt-step-3xs w-full rounded-control border border-edge-input-default bg-fill-input-default px-step-xs py-step-2xs text-body text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus" />
          </label>
        </fieldset>

        <fieldset class="rounded-panel border border-edge-base-default bg-fill-base-default p-step-md">
          <legend class="px-step-3xs font-bold text-pen-base-default">Preview</legend>
          <p class="mb-step-xs text-caption text-pen-muted-default">The preview shows this draft; the rest of the page keeps the active theme.</p>
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

        <button v-if="!isNew && model.ownership.ownerType !== 'system'" type="button" class="w-full rounded-control border px-step-sm py-step-2xs text-label transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:outline-offset-focus border-edge-error-default bg-fill-error-default text-pen-error-default hover:border-edge-error-hover hover:bg-fill-error-hover hover:text-pen-error-hover focus-visible:outline-edge-error-focus" @click="$emit('delete')">Delete Theme</button>
      </div>

      <div class="lg:col-span-2">
        <section class="mb-step-md grid gap-step-sm" :class="previewView === 'both' ? 'xl:grid-cols-2' : ''" aria-labelledby="theme-editor-preview-title">
          <h2 id="theme-editor-preview-title" class="sr-only">Draft preview</h2>
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

        <!-- Tabs follow the ARIA pattern: one tab stop, arrow keys, Home and End move and select. -->
        <div ref="tabList" class="mb-step-md flex gap-step-3xs overflow-x-auto border-b border-edge-base-default" role="tablist" aria-label="Theme editor sections" @keydown="onTabKey">
          <button
            v-for="tab in tabs"
            :id="`theme-editor-tab-${tab}`"
            :key="tab"
            type="button"
            role="tab"
            aria-controls="theme-editor-panel"
            :aria-selected="activeTab === tab"
            :tabindex="activeTab === tab ? 0 : -1"
            class="whitespace-nowrap border-b-md px-step-xs py-step-2xs capitalize transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:-outline-offset-focus focus-visible:outline-edge-primary-focus"
            :class="activeTab === tab ? 'border-edge-primary-default bg-fill-primary-default font-medium text-pen-primary-default' : 'border-transparent text-pen-muted-default hover:text-pen-base-default'"
            @click="activeTab = tab"
          >{{ tab }}</button>
        </div>

        <div id="theme-editor-panel" role="tabpanel" :aria-labelledby="`theme-editor-tab-${activeTab}`">
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
            <textarea id="theme-raw-json" :value="raw" rows="30" spellcheck="false" class="w-full rounded-panel border border-edge-input-default bg-fill-input-default p-step-sm font-mono text-caption text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus" @input="applyRaw(($event.target as HTMLTextAreaElement).value)" />
            <p v-if="rawError" role="alert" class="mt-step-2xs rounded-card border border-edge-error-default bg-fill-error-default p-step-xs text-label text-pen-error-default">{{ rawError }}</p>
            <button type="button" class="mt-step-2xs rounded-control border px-step-sm py-step-2xs text-label transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:outline-offset-focus border-edge-base-default bg-fill-base-default text-pen-base-default hover:bg-fill-base-hover focus-visible:outline-edge-base-focus" @click="formatRaw">Format JSON</button>
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

          <div v-else class="rounded-panel border border-edge-base-default bg-fill-base-default p-step-md">
            <p class="text-body text-pen-muted-default">Semantic asset bindings are managed as asset references. Raw JSON remains available for bindings until an external asset provider is composed.</p>
          </div>
        </div>
      </div>
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
// Unsaved: the model differs from the loaded Theme, or the raw JSON holds an edit that
// does not parse yet (the model has not taken it).
const dirty = computed(() => draft.dirty.value || !!rawError.value)
defineExpose({ dirty })
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

const tabList = ref<HTMLElement | null>(null)
function onTabKey(event: KeyboardEvent) {
  const index = tabs.indexOf(activeTab.value as (typeof tabs)[number])
  const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  activeTab.value = tabs[(next + tabs.length) % tabs.length]!
  nextTick(() => tabList.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
}

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
