<template>
  <div class="@container space-y-step-lg">
    <section v-for="group in groups" :key="group.id" :aria-labelledby="`${uid}-${group.id}`" class="space-y-step-xs">
      <h3 :id="`${uid}-${group.id}`" class="text-label font-bold text-pen-base-default">{{ group.title }}</h3>
      <p class="text-caption text-pen-muted-default">{{ group.note }}</p>

      <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
        <div class="grid content-start gap-step-2xs">
          <div v-for="token in group.tokens" :key="token.variable" class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-step-xs text-label text-pen-base-default">
            <span class="font-mono">{{ tokenKey(token) }}</span>
            <ThemeManagerThemeLengthField v-if="group.id === 'blur' || group.id === 'perspective'" :value="value(token)" :label="`${group.title}: ${tokenKey(token)}`" :min="0" @update="set(token, $event)" />
            <span v-else-if="group.id === 'tilt' && parseAngle(value(token)) !== null" class="flex items-center gap-step-3xs">
              <ThemeManagerThemeNumberField :value="String(parseAngle(value(token)))" :label="`${group.title}: ${tokenKey(token)} in degrees`" :min="0" :max="90" :step="1" @update="set(token, formatAngle(Number($event)))" />
              <span class="text-caption text-pen-muted-default">deg</span>
            </span>
            <span v-else-if="group.id === 'aspect' && parseRatio(value(token))" class="flex items-center gap-step-3xs">
              <ThemeManagerThemeNumberField :value="String(parseRatio(value(token))![0])" :label="`${group.title}: ${tokenKey(token)} width`" :min="0.01" :step="1" @update="setRatio(token, 0, $event)" />
              <span class="text-caption text-pen-muted-default">/</span>
              <ThemeManagerThemeNumberField :value="String(parseRatio(value(token))![1])" :label="`${group.title}: ${tokenKey(token)} height`" :min="0.01" :step="1" @update="setRatio(token, 1, $event)" />
            </span>
            <input v-else :value="value(token)" spellcheck="false" :aria-label="`${group.title}: ${tokenKey(token)}`" :class="[fieldClass, 'font-mono']" @change="set(token, ($event.target as HTMLInputElement).value)">
          </div>
        </div>

        <div class="grid content-start gap-step-xs">
          <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-2xs rounded-panel border border-edge-base-default p-step-sm">
            <p class="text-caption capitalize">{{ mode }}</p>
            <div class="flex flex-wrap items-end gap-step-sm">
              <span v-for="token in group.tokens" :key="token.variable" class="grid justify-items-center gap-step-3xs">
                <span class="block" :style="frameStyle(group.id)"><span class="block" :style="specimenStyle(group.id, token)">{{ group.id === 'blur' ? 'Aa' : '' }}</span></span>
                <span class="text-caption font-mono">{{ tokenKey(token) }}</span>
              </span>
            </div>
          </ThemeManagerThemePreviewScope>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'
import { formatAngle, formatRatio, parseAngle, parseRatio } from '../../../shared/motion-values'
import type { RuntimeTheme } from '../../../shared/theme-runtime'
import { createThemeTokenCatalogue, themeTokenValue, type ThemeToken } from '../../../shared/theme-token-catalogue'
import { apiName, tokenKey } from '../../../shared/token-references'

const props = defineProps<{
  theme: ThemeDefinition
  preview: RuntimeTheme | null
  previewModes: readonly ('light' | 'dark')[]
}>()
const emit = defineEmits<{ setValue: [path: string[], value: string] }>()

const uid = useId()
const fieldClass = 'w-full min-w-0 rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus'

type GroupId = 'blur' | 'perspective' | 'tilt' | 'aspect'
const GROUPS: ReadonlyArray<{ id: GroupId; title: string; note: string }> = [
  { id: 'blur', title: 'Blur', note: 'blur-*, backdrop-blur-*: frost for panels and dialog backdrops.' },
  { id: 'perspective', title: 'Perspective', note: 'perspective-*: shorter is stronger depth. Shown with the md tilt.' },
  { id: 'tilt', title: 'Tilt', note: 'rotate-x-tilt-*, rotate-y-tilt-*: angles for 3D turns. Shown at normal perspective.' },
  { id: 'aspect', title: 'Aspect ratios', note: 'aspect-*: width / height.' },
]

const catalogue = computed(() => createThemeTokenCatalogue(props.theme).filter(token => token.section === 'effects'))
const groups = computed(() => GROUPS.map(group => ({ ...group, tokens: catalogue.value.filter(token => token.group === group.id) })).filter(group => group.tokens.length))

const value = (token: ThemeToken) => themeTokenValue(props.theme, token) ?? ''

function set(token: ThemeToken, next: string) {
  emit('setValue', token.path.slice(1) as string[], next)
}

function setRatio(token: ThemeToken, index: 0 | 1, next: string) {
  const ratio = parseRatio(value(token))
  if (!ratio || Number(next) <= 0) return
  ratio[index] = Number(next)
  set(token, formatRatio(ratio))
}

// Specimens are inline-only: utilities are !important in this layer and would win.
function frameStyle(group: GroupId) {
  if (group === 'perspective') return { perspective: 'none' }
  if (group === 'tilt') return { perspective: 'var(--api-perspective-normal)' }
  return {}
}

function specimenStyle(group: GroupId, token: ThemeToken) {
  const api = `var(${apiName(token.variable)})`
  const card = { width: '3rem', height: '3rem', borderRadius: 'var(--api-radius-sm)', border: 'var(--api-border-width) solid var(--api-edge-primary-default)', backgroundColor: 'var(--api-fill-primary-default)' }
  switch (group) {
    case 'blur': return { ...card, display: 'grid', placeItems: 'center', fontSize: 'var(--api-text-xl)', fontWeight: 'var(--api-font-weight-bold)', color: 'var(--api-pen-primary-default)', filter: `blur(${api})` }
    // perspective() inside transform applies per element, so each specimen shows its own depth.
    case 'perspective': return { ...card, transform: `perspective(${api}) rotateY(var(--api-tilt-md))` }
    case 'tilt': return { ...card, transform: `rotateY(${api})` }
    case 'aspect': return { ...card, width: 'auto', height: '3rem', aspectRatio: api }
  }
}
</script>
