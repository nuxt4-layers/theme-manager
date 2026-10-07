<template>
  <div class="@container space-y-step-lg">
    <section v-for="group in groups" :key="group.id" :aria-labelledby="`${uid}-${group.id}`" class="space-y-step-xs">
      <h3 :id="`${uid}-${group.id}`" class="text-label font-bold text-pen-base-default">{{ group.title }}</h3>
      <p v-if="group.note" class="text-caption text-pen-muted-default">{{ group.note }}</p>

      <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
        <div class="grid content-start gap-step-2xs">
          <div v-for="token in group.tokens" :key="token.variable" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-step-xs text-label text-pen-base-default">
            <span class="font-mono">{{ label(token) }}</span>
            <select
              v-if="options(token, group.tokens)"
              :value="value(token)"
              :aria-label="`${group.title}: ${label(token)}`"
              :class="fieldClass"
              @change="set(token, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="option in options(token, group.tokens)" :key="option.value" :value="option.value">follows {{ option.label }}</option>
            </select>
            <span v-else-if="token.kind === 'reference'" class="text-caption text-pen-muted-default">follows {{ token.references?.replace('--ui-', '') }} (not editable here)</span>
            <ThemeManagerThemeLengthField
              v-else
              :value="value(token)"
              :label="`${group.title}: ${label(token)}`"
              :min="group.min"
              @update="set(token, $event)"
            />
          </div>
        </div>

        <div class="grid content-start gap-step-xs">
          <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-2xs rounded-panel border border-edge-base-default p-step-sm">
            <p class="text-caption capitalize">{{ mode }}</p>
            <!-- The focus ring and inset ring are one combined specimen each. -->
            <span
              v-if="group.specimen === 'focus' || group.specimen === 'ring'"
              class="inline-block px-step-sm py-step-2xs text-label"
              :style="specimenStyle(group.specimen, group.tokens[0]!)"
            >{{ group.specimen === 'focus' ? 'Focused control' : 'On, with an inset ring' }}</span>
            <template v-else>
              <div v-for="token in group.tokens" :key="token.variable" class="grid grid-cols-[minmax(0,1fr)_minmax(0,4fr)] items-center gap-step-xs">
                <span class="text-caption font-mono">{{ label(token) }}</span>
                <span :class="specimenClass" :style="specimenStyle(group.specimen, token)" />
              </div>
            </template>
          </ThemeManagerThemePreviewScope>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'
import { parseLength } from '../../../shared/css-value-parsers'
import type { RuntimeTheme } from '../../../shared/theme-runtime'
import { createThemeTokenCatalogue, themeTokenValue, type ThemeToken } from '../../../shared/theme-token-catalogue'
import { apiName, referenceOptions, tokenKey } from '../../../shared/token-references'

type Specimen = 'bar' | 'width' | 'radius' | 'line' | 'focus' | 'ring'
interface GroupConfig { id: string; title: string; specimen: Specimen; note?: string; min?: number }

const props = defineProps<{
  theme: ThemeDefinition
  section: 'spacing' | 'radii' | 'borders'
  preview: RuntimeTheme | null
  previewModes: readonly ('light' | 'dark')[]
}>()
const emit = defineEmits<{ setValue: [path: string[], value: string] }>()

const uid = useId()
const fieldClass = 'w-full rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus'
// Specimens take every visual property inline: utilities are !important in this layer
// (main.css imports Tailwind as important), so a class would override the inline value.
const specimenClass = 'block'

const SECTIONS: Record<typeof props.section, Record<string, GroupConfig>> = {
  spacing: {
    spacing: { id: 'spacing', title: 'Spacing steps', specimen: 'bar', min: 0, note: 'p-step-*, gap-step-*, m-step-*. The base unit (--ui-spacing) is not settable by design.' },
    containers: { id: 'containers', title: 'Content widths', specimen: 'width', min: 0, note: 'max-w-*, w-*. Screen widths follow the breakpoints, which are compiled and cannot change at runtime.' },
  },
  radii: {
    radii: { id: 'radii', title: 'Corner radii', specimen: 'radius', min: 0, note: 'Sizes, then the roles components use (rounded-card); a role follows a size.' },
  },
  borders: {
    widths: { id: 'widths', title: 'Border widths', specimen: 'line', min: 0, note: 'border, border-xs to border-xl, divide-*; default is the plain border.' },
    focusRing: { id: 'focusRing', title: 'Focus ring', specimen: 'focus', min: 0, note: 'outline-focus and outline-offset-focus: drawn outside the control.' },
    ring: { id: 'ring', title: 'Inset ring', specimen: 'ring', min: 0, note: 'inset-ring-focus: thickens an edge for on and error without changing size.' },
  },
}

const catalogue = computed(() => createThemeTokenCatalogue(props.theme))
const groups = computed(() => Object.values(SECTIONS[props.section]).map(config => ({
  ...config,
  tokens: catalogue.value.filter(token => token.group === config.id && (props.section !== 'spacing' || token.section === 'spacing')),
})).filter(group => group.tokens.length))

const label = (token: ThemeToken) => (tokenKey(token) === 'DEFAULT' ? 'default' : tokenKey(token))
const value = (token: ThemeToken) => themeTokenValue(props.theme, token) ?? ''
const options = (token: ThemeToken, group: readonly ThemeToken[]) => referenceOptions(token, group)

function set(token: ThemeToken, next: string) {
  emit('setValue', token.path.slice(1) as string[], next)
}

// Widths are drawn to scale against the widest content width (screen widths read the
// breakpoint they follow), since CSS cannot divide one length by another.
const REM = 16
function pixels(token: ThemeToken): number | null {
  const target = token.kind === 'reference'
    ? catalogue.value.find(candidate => candidate.variable === token.references)
    : token
  const length = target ? parseLength(value(target)) : null
  if (!length) return null
  return length.unit === 'px' || !length.unit ? length.value : length.value * REM
}

const widest = computed(() => Math.max(1, ...(groups.value.find(group => group.id === 'containers')?.tokens ?? []).map(token => pixels(token) ?? 0)))

function specimenStyle(specimen: Specimen, token: ThemeToken) {
  const api = `var(${apiName(token.variable)})`
  switch (specimen) {
    case 'bar': return { width: api, height: '0.75rem', borderRadius: 'var(--api-radius-xs)', backgroundColor: 'var(--api-fill-accent-default)' }
    case 'width': return { width: `${Math.min(100, ((pixels(token) ?? 0) / widest.value) * 100)}%`, height: '0.75rem', borderRadius: 'var(--api-radius-xs)', backgroundColor: 'var(--api-fill-primary-selected)' }
    case 'radius': return { width: '3rem', height: '3rem', borderRadius: api, border: 'var(--api-border-width) solid var(--api-edge-primary-default)', backgroundColor: 'var(--api-fill-primary-default)' }
    case 'line': return { borderTop: `${api} solid var(--api-pen-base-default)` }
    case 'focus': return { outline: 'var(--api-focus-ring-width) solid var(--api-edge-base-focus)', outlineOffset: 'var(--api-focus-ring-offset)', border: 'var(--api-border-width) solid var(--api-edge-base-default)', borderRadius: 'var(--api-radius-control)', backgroundColor: 'var(--api-fill-base-default)', color: 'var(--api-pen-base-default)' }
    case 'ring': return { boxShadow: 'inset 0 0 0 var(--api-ring-width) var(--api-edge-accent-on)', borderRadius: 'var(--api-radius-control)', backgroundColor: 'var(--api-fill-accent-on)', color: 'var(--api-pen-accent-on)' }
  }
}
</script>
