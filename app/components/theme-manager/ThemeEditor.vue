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
          <p class="mb-3 text-xs text-pen-muted-default">Edit and preview the complete semantic colour vocabulary in either presentation mode.</p>
          <div class="flex gap-2">
            <button v-for="mode in ['light', 'dark'] as const" :key="mode" type="button" class="flex-1 rounded-lg border px-3 py-2 capitalize" :class="previewMode === mode ? 'border-edge-primary-default bg-fill-primary-default text-pen-primary-default' : 'border-edge-base-default text-pen-muted-default'" @click="setMode(mode)">{{ mode }}</button>
          </div>
        </fieldset>

        <button v-if="!isNew && model.ownership.ownerType !== 'system'" type="button" class="w-full rounded-lg border border-edge-error-default px-4 py-2 text-pen-error-default" @click="$emit('delete')">Delete Theme</button>
      </aside>

      <main class="lg:col-span-2">
        <div class="mb-4 flex gap-2 overflow-x-auto border-b border-edge-base-default">
          <button v-for="tab in tabs" :key="tab" type="button" class="whitespace-nowrap px-3 py-2 capitalize" :class="activeTab === tab ? 'border-b-2 border-edge-primary-default text-pen-primary-default' : 'text-pen-muted-default'" @click="activeTab = tab">{{ tab }}</button>
        </div>

        <div v-if="activeTab === 'colours'" class="space-y-5">
          <div class="flex flex-wrap gap-2">
            <button v-for="category in categories" :key="category.id" type="button" class="rounded-full border px-4 py-2 text-sm font-medium" :class="activeCategory === category.id ? 'border-edge-primary-default bg-fill-primary-default text-pen-primary-default' : 'border-edge-base-default text-pen-muted-default'" @click="activeCategory = category.id">{{ category.label }}</button>
          </div>

          <article v-for="[role, states] in visibleColourRoles" :key="role" class="overflow-hidden rounded-xl border border-edge-base-default bg-fill-base-default">
            <header class="flex items-center justify-between border-b border-edge-base-default bg-fill-floor-default px-5 py-3">
              <div class="flex items-center gap-3">
                <span class="h-8 w-2 rounded bg-fill-primary-default" aria-hidden="true" />
                <h2 class="font-mono font-bold text-pen-base-default">{{ roleLabel(role) }}</h2>
              </div>
              <code class="rounded border border-edge-base-default bg-fill-base-default px-2 py-1 text-xs text-pen-muted-default">{{ role }}</code>
            </header>

            <div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <label v-for="[state, value] in orderedStates(states)" :key="state" class="text-xs font-bold uppercase tracking-wide text-pen-muted-default">
                {{ state }}
                <div class="mt-1.5 flex items-center gap-2 rounded-lg border border-edge-input-default bg-fill-input-default p-1.5 focus-within:ring-2 focus-within:ring-edge-primary-default">
                  <div class="relative size-8 shrink-0 overflow-hidden rounded-md border border-edge-base-default">
                    <input type="color" class="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 p-0" :value="colourInput(value)" @input="setColour(role, state, ($event.target as HTMLInputElement).value)" />
                  </div>
                  <input :value="value" maxlength="32" class="min-w-0 flex-1 bg-transparent px-1 py-1 font-mono text-sm text-pen-base-default outline-none" @input="setColour(role, state, ($event.target as HTMLInputElement).value)" />
                </div>
              </label>
            </div>
          </article>

          <p v-if="visibleColourRoles.length === 0" class="rounded-xl border border-edge-base-default p-8 text-center text-pen-muted-default">No {{ activeCategory }} colour roles are present in this Theme.</p>
        </div>

        <div v-else-if="activeTab === 'raw'">
          <label class="sr-only" for="theme-raw-json">Theme Definition JSON</label>
          <textarea id="theme-raw-json" v-model="raw" rows="30" spellcheck="false" class="w-full rounded-xl border border-edge-base-default bg-fill-base-default p-4 font-mono text-xs text-pen-base-default" @input="applyRaw" />
          <p v-if="rawError" role="alert" class="mt-2 text-sm text-pen-error-default">{{ rawError }}</p>
          <button type="button" class="mt-2 text-sm text-pen-primary-default" @click="formatRaw">Format JSON</button>
        </div>

        <div v-else-if="activeTab !== 'assets'" class="space-y-4">
          <article v-for="[path, value] in presentationEntries" :key="path" class="rounded-xl border border-edge-base-default bg-fill-base-default p-4">
            <label class="block text-xs font-bold uppercase tracking-wide text-pen-muted-default">
              {{ path }}
              <input :value="value" class="mt-2 w-full rounded-lg border border-edge-input-default bg-fill-input-default px-3 py-2 font-mono text-sm text-pen-base-default" @input="setPresentationValue(path, ($event.target as HTMLInputElement).value)" />
            </label>
          </article>
          <p v-if="presentationEntries.length === 0" class="rounded-xl border border-edge-base-default p-8 text-center text-pen-muted-default">No {{ activeTab }} values are present in this Theme.</p>
        </div>

        <div v-else class="rounded-xl border border-edge-base-default bg-fill-base-default p-6">
          <p class="text-pen-muted-default">Semantic asset bindings are managed as asset references. Raw JSON remains available for bindings until an external asset provider is composed.</p>
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

const model = reactive(structuredClone(toRaw(props.theme)))
const activeTab = ref<'colours' | 'typography' | 'spacing' | 'radii' | 'effects' | 'responsive' | 'assets' | 'raw'>('colours')
const tabs = ['colours', 'typography', 'spacing', 'radii', 'effects', 'responsive', 'assets', 'raw'] as const
const categories = [
  { id: 'fill', label: 'Fill (Backgrounds)' },
  { id: 'pen', label: 'Pen (Text & Icons)' },
  { id: 'edge', label: 'Edge (Borders)' },
] as const
const activeCategory = ref<(typeof categories)[number]['id']>('fill')
const previewMode = ref<'light' | 'dark'>('light')
const raw = ref(JSON.stringify(model, null, 2))
const rawError = ref<string | null>(null)
const interactionOrder = ['default', 'hover', 'active', 'selected', 'visited', 'disabled'] as const

const colourModes = computed(() => model.modes as Record<string, Record<string, Record<string, string>>>)
const visibleColourRoles = computed(() =>
  Object.entries(colourModes.value[previewMode.value] ?? {})
    .filter(([role]) => role.startsWith(`${activeCategory.value}-`))
    .sort(([left], [right]) => left.localeCompare(right)),
)

const presentationEntries = computed(() => {
  if (activeTab.value === 'colours' || activeTab.value === 'raw' || activeTab.value === 'assets') return []
  const familyKey = activeTab.value === 'radii' ? 'radii' : activeTab.value
  const family = model.presentation[familyKey] as Record<string, unknown>
  return flattenPresentation(family)
})

function flattenPresentation(value: Record<string, unknown>, prefix = ''): Array<[string, string]> {
  const result: Array<[string, string]> = []
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) result.push(...flattenPresentation(entry as Record<string, unknown>, path))
    else result.push([path, String(entry)])
  }
  return result
}

function setPresentationValue(path: string, value: string) {
  const familyKey = activeTab.value === 'radii' ? 'radii' : activeTab.value
  let target = model.presentation[familyKey] as Record<string, unknown>
  const parts = path.split('.')
  const leaf = parts.pop()!
  for (const part of parts) target = target[part] as Record<string, unknown>
  target[leaf] = value
  syncRaw()
  preview()
}

function roleLabel(role: string) {
  return role.replace(`${activeCategory.value}-`, '').replaceAll('-', ' ')
}

function orderedStates(states: Record<string, string>) {
  return Object.entries(states).sort(([left], [right]) => {
    const leftIndex = interactionOrder.indexOf(left as (typeof interactionOrder)[number])
    const rightIndex = interactionOrder.indexOf(right as (typeof interactionOrder)[number])
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right)
    if (leftIndex === -1) return 1
    if (rightIndex === -1) return -1
    return leftIndex - rightIndex
  })
}

function colourInput(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}

function syncRaw() {
  raw.value = JSON.stringify(model, null, 2)
}

function preview() {
  emit('preview', parseThemeDefinition(toRaw(model)))
}

function setColour(role: string, state: string, value: string) {
  const roleStates = colourModes.value[previewMode.value]?.[role]
  if (!roleStates) return
  roleStates[state] = value
  syncRaw()
  preview()
}

function setMode(mode: 'light' | 'dark') {
  previewMode.value = mode
  if (import.meta.client) document.documentElement.classList.toggle('dark', mode === 'dark')
  preview()
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
    emit('save', parseThemeDefinition(toRaw(model)))
  }
  catch (error) {
    rawError.value = error instanceof Error ? error.message : 'Invalid Theme Definition.'
  }
}

onBeforeUnmount(() => emit('stopPreview'))
</script>
