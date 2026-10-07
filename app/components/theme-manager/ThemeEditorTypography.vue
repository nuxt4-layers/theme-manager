<template>
  <div class="@container space-y-step-lg">
    <section :aria-labelledby="`${uid}-families`" class="space-y-step-xs">
      <h3 :id="`${uid}-families`" class="text-label font-bold text-pen-base-default">Font families</h3>
      <p class="text-caption text-pen-muted-default">Each stack ends in system fonts; load the web fonts wherever the theme is used.</p>
      <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
        <div class="grid content-start gap-step-2xs">
          <label v-for="family in families" :key="family" class="grid gap-step-3xs text-label text-pen-base-default">{{ family }}
            <input :value="typography.families?.[family] ?? ''" spellcheck="false" :class="[fieldClass, 'font-mono']" @change="set(['families', family], ($event.target as HTMLInputElement).value)">
          </label>
        </div>
        <div class="grid content-start gap-step-xs">
          <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-2xs rounded-panel border border-edge-base-default p-step-sm">
            <p class="text-caption capitalize">{{ mode }}</p>
            <p v-for="family in families" :key="family" :style="{ fontFamily: `var(--api-font-${family})`, color: 'var(--api-pen-base-default)' }">{{ family }}: The quick brown fox jumps over the lazy dog</p>
          </ThemeManagerThemePreviewScope>
        </div>
      </div>
    </section>

    <section :aria-labelledby="`${uid}-sizes`" class="space-y-step-xs">
      <h3 :id="`${uid}-sizes`" class="text-label font-bold text-pen-base-default">Sizes and line heights</h3>
      <p class="text-caption text-pen-muted-default">Every size carries its own line height (text-sm sets both).</p>
      <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
        <div class="grid content-start gap-step-2xs">
          <div v-for="size in sizes" :key="size" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)] items-center gap-step-xs text-label text-pen-base-default">
            <span class="font-mono">{{ size }}</span>
            <ThemeManagerThemeLengthField :value="typography.sizes[size] ?? ''" :label="`Size ${size}`" :min="0" @update="set(['sizes', size], $event)" />
            <ThemeManagerThemeNumberField
              v-if="isUnitless(typography.sizes[`${size}-line-height`] ?? '')"
              :value="typography.sizes[`${size}-line-height`] ?? ''"
              :label="`Size ${size} line height`"
              :min="0"
              @update="set(['sizes', `${size}-line-height`], $event)"
            />
            <ThemeManagerThemeLengthField v-else :value="typography.sizes[`${size}-line-height`] ?? ''" :label="`Size ${size} line height`" :min="0" @update="set(['sizes', `${size}-line-height`], $event)" />
          </div>
        </div>
        <div class="grid content-start gap-step-xs">
          <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-2xs overflow-hidden rounded-panel border border-edge-base-default p-step-sm">
            <p class="text-caption capitalize">{{ mode }}</p>
            <p v-for="size in sizes" :key="size" class="truncate" :style="sizeStyle(size)">{{ size }} · Calm skies ahead</p>
          </ThemeManagerThemePreviewScope>
        </div>
      </div>
    </section>

    <section :aria-labelledby="`${uid}-roles`" class="space-y-step-xs">
      <h3 :id="`${uid}-roles`" class="text-label font-bold text-pen-base-default">Type roles</h3>
      <p class="text-caption text-pen-muted-default">Components set text through roles (text-body); a role follows a size and its line height together.</p>
      <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
        <div class="grid content-start gap-step-2xs">
          <label v-for="role in roles" :key="role" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-step-xs text-label text-pen-base-default">
            <span class="font-mono">{{ role }}</span>
            <select :value="roleSize(typography.sizes, role) ?? ''" :class="fieldClass" @change="setRole(role, ($event.target as HTMLSelectElement).value)">
              <option v-if="!roleSize(typography.sizes, role)" value="">custom</option>
              <option v-for="size in sizes" :key="size" :value="size">follows {{ size }}</option>
            </select>
          </label>
        </div>
        <div class="grid content-start gap-step-xs">
          <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-2xs rounded-panel border border-edge-base-default p-step-sm">
            <p class="text-caption capitalize">{{ mode }}</p>
            <p v-for="role in roles" :key="role" :style="sizeStyle(role)">{{ roleSamples[role] ?? role }}</p>
          </ThemeManagerThemePreviewScope>
        </div>
      </div>
    </section>

    <div class="grid gap-step-lg @min-[48rem]:grid-cols-3">
      <section v-for="scale in scales" :key="scale.group" :aria-labelledby="`${uid}-${scale.group}`" class="space-y-step-xs">
        <h3 :id="`${uid}-${scale.group}`" class="text-label font-bold text-pen-base-default">{{ scale.title }}</h3>
        <p class="text-caption text-pen-muted-default">{{ scale.note }}</p>
        <label v-for="key in Object.keys(typography[scale.group] ?? {})" :key="key" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-step-xs text-label text-pen-base-default">
          <span class="font-mono">{{ key }}</span>
          <ThemeManagerThemeLengthField v-if="scale.kind === 'length'" :value="valueOf(scale.group, key)" :label="`${scale.title}: ${key}`" @update="set([scale.group, key], $event)" />
          <ThemeManagerThemeNumberField v-else :value="valueOf(scale.group, key)" :label="`${scale.title}: ${key}`" :min="scale.min" :max="scale.max" :step="scale.step" @update="set([scale.group, key], $event)" />
        </label>
        <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-3xs rounded-panel border border-edge-base-default p-step-sm">
          <p class="text-caption capitalize">{{ mode }}</p>
          <p v-for="key in Object.keys(typography[scale.group] ?? {})" :key="key" :style="scaleStyle(scale.group, key)">{{ scale.sample(key) }}</p>
        </ThemeManagerThemePreviewScope>
      </section>
    </div>

    <section :aria-labelledby="`${uid}-code`" class="space-y-step-xs">
      <h3 :id="`${uid}-code`" class="text-label font-bold text-pen-base-default">Code font</h3>
      <p class="text-caption text-pen-muted-default">font-feature-settings for the mono stack; ligatures off show every character as typed.</p>
      <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="rounded-panel border border-edge-base-default p-step-sm">
        <code :style="{ fontFamily: 'var(--api-font-mono)', fontFeatureSettings: 'var(--api-font-mono-feature-settings)' }">-&gt; =&gt; != === 0O 1lI</code>
      </ThemeManagerThemePreviewScope>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { RuntimeTheme } from '../../../shared/theme-runtime'
import { isUnitless, roleSize, roleValues, typeRoles, typeSizes } from '../../../shared/type-scale'

type Typography = { families?: Record<string, string>; sizes: Record<string, string>; weights?: Record<string, string>; tracking?: Record<string, string>; leading?: Record<string, string> }
const props = defineProps<{
  typography: Typography
  preview: RuntimeTheme | null
  previewModes: readonly ('light' | 'dark')[]
}>()
const emit = defineEmits<{ setValue: [path: string[], value: string] }>()

const uid = useId()
const fieldClass = 'w-full rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus'

const families = computed(() => Object.keys(props.typography.families ?? {}).filter(key => !key.endsWith('-feature-settings')))
const sizes = computed(() => typeSizes(props.typography.sizes))
const roles = computed(() => typeRoles(props.typography.sizes))
const roleSamples: Record<string, string> = {
  title: 'Theme settings',
  heading: 'Colours and states',
  body: 'Every interactive component uses one shared set of twelve states.',
  label: 'Display name',
  caption: 'Updated 2 minutes ago',
}

interface TypeScale {
  group: 'weights' | 'tracking' | 'leading'
  title: string
  note: string
  kind: 'number' | 'length'
  min?: number
  max?: number
  step?: number
  sample: (key: string) => string
}
const scales: readonly TypeScale[] = [
  { group: 'weights', title: 'Weights', note: 'font-normal to font-bold; 100 to 900.', kind: 'number', min: 100, max: 900, step: 100, sample: (key: string) => `${key} weight` },
  { group: 'tracking', title: 'Letter spacing', note: 'tracking-*; caps for uppercase labels.', kind: 'length', sample: (key: string) => `${key.toUpperCase()} TRACKING` },
  { group: 'leading', title: 'Line height', note: 'leading-* overrides; sizes already carry one.', kind: 'number', min: 0, step: 0.025, sample: (key: string) => `${key}: two lines of text show how far apart the lines sit.` },
]

const valueOf = (group: 'weights' | 'tracking' | 'leading', key: string) => props.typography[group]?.[key] ?? ''

function set(path: string[], value: string) {
  emit('setValue', ['typography', ...path], value)
}

function setRole(role: string, size: string) {
  if (!size) return
  for (const [key, value] of Object.entries(roleValues(role, size))) set(['sizes', key], value)
}

// Specimens read --api-* names inside the preview scope; inline, because utilities are
// !important in this layer and would override the inline values.
function sizeStyle(key: string) {
  return { fontSize: `var(--api-text-${key})`, lineHeight: `var(--api-text-${key}-line-height)`, color: 'var(--api-pen-base-default)' }
}

function scaleStyle(group: 'weights' | 'tracking' | 'leading', key: string) {
  const base = { color: 'var(--api-pen-base-default)', fontSize: 'var(--api-text-sm)' }
  if (group === 'weights') return { ...base, fontWeight: `var(--api-font-weight-${key})` }
  if (group === 'tracking') return { ...base, letterSpacing: `var(--api-tracking-${key})` }
  return { ...base, lineHeight: `var(--api-leading-${key})`, maxWidth: '16rem' }
}
</script>
