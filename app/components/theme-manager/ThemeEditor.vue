<template>
  <section class="mx-auto max-w-6xl px-4 py-6" aria-labelledby="theme-editor-title">
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-edge-base-default pb-4">
      <div>
        <p class="text-sm text-pen-muted-default">Theme Manager / Editor</p>
        <h1 id="theme-editor-title" class="text-2xl font-bold text-pen-base-default">{{ model.name || 'Untitled Theme' }}</h1>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded-lg border border-edge-base-default px-4 py-2 text-pen-base-default" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="rounded-lg bg-fill-primary-default px-4 py-2 font-bold text-pen-base-default disabled:opacity-50" :disabled="saving || !!rawError" @click="save">Save</button>
      </div>
    </header>

    <div v-if="error" role="alert" class="mb-5 rounded-lg border border-edge-error-default p-4 text-pen-error-default">{{ error }}</div>

    <div class="grid gap-6 lg:grid-cols-3">
      <aside class="space-y-5">
        <fieldset class="rounded-xl border border-edge-base-default bg-fill-base-default p-5">
          <legend class="px-1 font-bold text-pen-base-default">General</legend>
          <label class="mb-4 block text-sm text-pen-muted-default">Name
            <input v-model="model.name" class="mt-1 w-full rounded-lg border border-edge-input-default bg-fill-input-default px-3 py-2 text-pen-base-default" />
          </label>
          <label class="block text-sm text-pen-muted-default">Description
            <textarea v-model="model.description" rows="3" class="mt-1 w-full rounded-lg border border-edge-input-default bg-fill-input-default px-3 py-2 text-pen-base-default" />
          </label>
        </fieldset>

        <fieldset class="rounded-xl border border-edge-base-default bg-fill-base-default p-5">
          <legend class="px-1 font-bold text-pen-base-default">Preview</legend>
          <div class="flex gap-2">
            <button v-for="mode in ['light', 'dark'] as const" :key="mode" type="button" class="rounded-lg border px-3 py-2 capitalize" :class="previewMode === mode ? 'border-edge-primary-default text-pen-primary-default' : 'border-edge-base-default text-pen-muted-default'" @click="setMode(mode)">{{ mode }}</button>
          </div>
        </fieldset>

        <button v-if="!isNew && model.ownership.ownerType !== 'system'" type="button" class="w-full rounded-lg border border-edge-error-default px-4 py-2 text-pen-error-default" @click="$emit('delete')">Delete Theme</button>
      </aside>

      <main class="lg:col-span-2">
        <div class="mb-4 flex gap-2 border-b border-edge-base-default">
          <button v-for="tab in tabs" :key="tab" type="button" class="px-3 py-2 capitalize" :class="activeTab === tab ? 'border-b-2 border-edge-primary-default text-pen-primary-default' : 'text-pen-muted-default'" @click="activeTab = tab">{{ tab }}</button>
        </div>

        <div v-if="activeTab === 'colours'" class="space-y-5">
          <div class="flex flex-wrap gap-2">
            <button v-for="category in categories" :key="category" type="button" class="rounded-full border px-3 py-1 capitalize" :class="activeCategory === category ? 'border-edge-primary-default text-pen-primary-default' : 'border-edge-base-default text-pen-muted-default'" @click="activeCategory = category">{{ category }}</button>
          </div>

          <article v-for="[role, states] in visibleColourRoles" :key="role" class="rounded-xl border border-edge-base-default bg-fill-base-default p-5">
            <h2 class="mb-4 font-mono font-bold text-pen-base-default">{{ role }}</h2>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label v-for="[state, value] in Object.entries(states)" :key="state" class="text-xs uppercase text-pen-muted-default">
                {{ state }}
                <div class="mt-1 flex items-center gap-2 rounded-lg border border-edge-input-default bg-fill-input-default p-1">
                  <input type="color" :value="colourInput(value)" @input="setColour(role, state, ($event.target as HTMLInputElement).value)" />
                  <input :value="value" class="min-w-0 flex-1 bg-transparent px-1 py-1 font-mono text-sm text-pen-base-default" @input="setColour(role, state, ($event.target as HTMLInputElement).value)" />
                </div>
              </label>
            </div>
          </article>
        </div>

        <div v-else-if="activeTab === 'raw'">
          <label class="sr-only" for="theme-raw-json">Theme Definition JSON</label>
          <textarea id="theme-raw-json" v-model="raw" rows="30" spellcheck="false" class="w-full rounded-xl border border-edge-base-default bg-fill-base-default p-4 font-mono text-xs text-pen-base-default" @input="applyRaw" />
          <p v-if="rawError" role="alert" class="mt-2 text-sm text-pen-error-default">{{ rawError }}</p>
          <button type="button" class="mt-2 text-sm text-pen-primary-default" @click="formatRaw">Format JSON</button>
        </div>

        <div v-else class="rounded-xl border border-edge-base-default bg-fill-base-default p-6">
          <p class="text-pen-muted-default">This Theme Definition contains the {{ activeTab }} presentation family. Raw JSON remains available for complete editing until its specialised visual editor is introduced.</p>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'
import { parseThemeDefinition } from '../../../shared/theme-definition'

const props = defineProps<{ theme: ThemeDefinition; isNew?: boolean; saving?: boolean; error?: string | null }>()
const emit = defineEmits<{ save: [theme: ThemeDefinition]; cancel: []; delete: []; preview: [theme: ThemeDefinition]; stopPreview: [] }>()

const model = reactive(structuredClone(props.theme))
const activeTab = ref<'colours' | 'typography' | 'spacing' | 'radii' | 'effects' | 'responsive' | 'assets' | 'raw'>('colours')
const tabs = ['colours', 'typography', 'spacing', 'radii', 'effects', 'responsive', 'assets', 'raw'] as const
const categories = ['fill', 'pen', 'edge'] as const
const activeCategory = ref<(typeof categories)[number]>('fill')
const previewMode = ref<'light' | 'dark'>('light')
const raw = ref(JSON.stringify(model, null, 2))
const rawError = ref<string | null>(null)

const colourModes = computed(() => model.modes as Record<string, Record<string, Record<string, string>>>)
const visibleColourRoles = computed(() =>
  Object.entries(colourModes.value[previewMode.value] ?? {}).filter(([role]) => role.startsWith(`${activeCategory.value}-`)),
)

function colourInput(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}

function syncRaw() {
  raw.value = JSON.stringify(model, null, 2)
}

function setColour(role: string, state: string, value: string) {
  const roleStates = colourModes.value[previewMode.value]?.[role]
  if (!roleStates) return
  roleStates[state] = value
  syncRaw()
  emit('preview', parseThemeDefinition(model))
}

function setMode(mode: 'light' | 'dark') {
  previewMode.value = mode
  if (import.meta.client) document.documentElement.classList.toggle('dark', mode === 'dark')
  emit('preview', parseThemeDefinition(model))
}

function applyRaw() {
  try {
    const next = parseThemeDefinition(JSON.parse(raw.value))
    Object.assign(model, structuredClone(next))
    rawError.value = null
    emit('preview', next)
  }
  catch (error) {
    rawError.value = error instanceof Error ? error.message : 'Invalid Theme Definition.'
  }
}

function formatRaw() {
  applyRaw()
  if (!rawError.value) syncRaw()
}

function save() {
  try {
    emit('save', parseThemeDefinition(model))
  }
  catch (error) {
    rawError.value = error instanceof Error ? error.message : 'Invalid Theme Definition.'
  }
}

onBeforeUnmount(() => emit('stopPreview'))
</script>
