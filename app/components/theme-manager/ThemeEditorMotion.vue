<template>
  <div class="@container space-y-step-lg">
    <div class="flex flex-wrap items-center justify-between gap-step-xs">
      <p class="text-caption text-pen-muted-default">Specimens move only while playing. Keyframes are compiled: a theme sets an animation's timing, never what it does.</p>
      <button type="button" :aria-pressed="playing" :class="buttonClass" @click="playing = !playing">{{ playing ? 'Stop' : 'Play' }} motion</button>
    </div>

    <section v-for="group in groups" :key="group.id" :aria-labelledby="`${uid}-${group.id}`" class="space-y-step-xs">
      <h3 :id="`${uid}-${group.id}`" class="text-label font-bold text-pen-base-default">{{ group.title }}</h3>
      <p class="text-caption text-pen-muted-default">{{ group.note }}</p>

      <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
        <div class="grid content-start gap-step-2xs">
          <div v-for="token in group.tokens" :key="token.variable" class="grid grid-cols-[minmax(0,1fr)_minmax(0,3fr)] items-center gap-step-xs text-label text-pen-base-default">
            <span class="font-mono">{{ tokenKey(token) }}</span>

            <select v-if="referenceOptions(token, group.tokens)" :value="value(token)" :aria-label="`${group.title}: ${tokenKey(token)}`" :class="fieldClass" @change="set(token, ($event.target as HTMLSelectElement).value)">
              <option v-for="option in referenceOptions(token, group.tokens)" :key="option.value" :value="option.value">follows {{ option.label }}</option>
            </select>

            <span v-else-if="group.id === 'ease' && parseBezier(value(token))" class="grid grid-cols-4 gap-step-3xs">
              <ThemeManagerThemeNumberField
                v-for="(point, index) in parseBezier(value(token))!"
                :key="index"
                :value="String(point)"
                :label="`${group.title}: ${tokenKey(token)} ${bezierLabels[index]}`"
                :min="index % 2 === 0 ? 0 : undefined"
                :max="index % 2 === 0 ? 1 : undefined"
                @update="setBezier(token, index, $event)"
              />
            </span>

            <span v-else-if="group.id === 'duration' && parseDuration(value(token)) !== null" class="flex items-center gap-step-3xs">
              <ThemeManagerThemeNumberField :value="String(parseDuration(value(token)))" :label="`${group.title}: ${tokenKey(token)} in milliseconds`" :min="0" :step="5" @update="set(token, formatDuration(Number($event)))" />
              <span class="text-caption text-pen-muted-default">ms</span>
            </span>

            <span v-else-if="group.id === 'animate' && parseAnimation(value(token))" class="grid grid-cols-2 gap-step-3xs">
              <select :value="parseAnimation(value(token))!.duration" :aria-label="`${group.title}: ${tokenKey(token)} duration`" :class="fieldClass" @change="setAnimation(token, 'duration', ($event.target as HTMLSelectElement).value)">
                <option v-for="option in choices('duration', parseAnimation(value(token))!.duration)" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <select :value="parseAnimation(value(token))!.easing" :aria-label="`${group.title}: ${tokenKey(token)} easing`" :class="fieldClass" @change="setAnimation(token, 'easing', ($event.target as HTMLSelectElement).value)">
                <option v-for="option in choices('ease', parseAnimation(value(token))!.easing)" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </span>

            <input v-else :value="value(token)" spellcheck="false" :aria-label="`${group.title}: ${tokenKey(token)}`" :class="[fieldClass, 'font-mono']" @change="set(token, ($event.target as HTMLInputElement).value)">
          </div>
        </div>

        <div class="grid content-start gap-step-xs">
          <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-2xs rounded-panel border border-edge-base-default p-step-sm">
            <p class="text-caption capitalize">{{ mode }}</p>
            <div v-for="token in group.tokens" :key="token.variable" class="grid grid-cols-[minmax(0,1fr)_minmax(0,4fr)] items-center gap-step-xs">
              <span class="text-caption font-mono">{{ tokenKey(token) }}</span>
              <span v-if="group.id === 'ease'" class="flex items-center gap-step-xs">
                <!-- The unit box (time across, progress up) with room above for overshoot. -->
                <svg v-if="curve(token)" viewBox="-8 -30 116 146" class="block" :style="{ width: '4rem', height: '5rem', flex: 'none' }" aria-hidden="true">
                  <rect x="0" y="0" width="100" height="100" fill="none" stroke-width="1.5" :style="{ stroke: 'var(--api-edge-muted-default)' }" />
                  <path :d="curve(token)!" fill="none" stroke-width="4" stroke-linecap="round" :style="{ stroke: 'var(--api-pen-base-default)' }" />
                </svg>
                <span class="block" :style="trackStyle"><span class="block" :style="easeDotStyle(token)" /></span>
              </span>
              <span v-else-if="group.id === 'duration'" class="block" :style="trackStyle"><span class="block" :style="durationBarStyle(token)" /></span>
              <span v-else class="block" :style="{ height: '1.5rem' }"><span v-if="playing" :key="playKey" class="block" :style="animationStyle(token)" /></span>
            </div>
          </ThemeManagerThemePreviewScope>
        </div>
      </div>
    </section>

    <p v-if="!groups.length" class="text-caption text-pen-muted-default">This Theme sets no motion values; it uses the defaults.</p>
  </div>
</template>

<script setup lang="ts">
import type { ThemeDefinition } from '../../../contracts'
import { bezierPath, formatAnimation, formatBezier, formatDuration, parseAnimation, parseBezier, parseDuration, type Animation, type Bezier } from '../../../shared/motion-values'
import type { RuntimeTheme } from '../../../shared/theme-runtime'
import { createThemeTokenCatalogue, themeTokenValue, type ThemeToken } from '../../../shared/theme-token-catalogue'
import { apiName, referenceOptions, tokenKey } from '../../../shared/token-references'

const props = defineProps<{
  theme: ThemeDefinition
  preview: RuntimeTheme | null
  previewModes: readonly ('light' | 'dark')[]
}>()
const emit = defineEmits<{ setValue: [path: string[], value: string] }>()

const uid = useId()
const fieldClass = 'w-full min-w-0 rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus'
const buttonClass = 'rounded-control border border-edge-base-default bg-fill-base-default px-step-sm py-step-2xs text-label text-pen-base-default transition-[background-color,border-color,color] hover:bg-fill-base-hover aria-pressed:border-edge-primary-selected aria-pressed:bg-fill-primary-selected aria-pressed:text-pen-primary-selected focus-visible:outline-focus focus-visible:outline-edge-base-focus'
const bezierLabels = ['x1', 'y1', 'x2', 'y2']

const GROUPS = [
  { id: 'ease', title: 'Easing', note: 'ease-* curves; enter and exit follow a curve. x stays within 0 to 1; y may overshoot (spring).' },
  { id: 'duration', title: 'Durations', note: 'duration-*; each speed has a shorter exit.' },
  { id: 'animate', title: 'Animations', note: 'animate-*: duration and easing of each compiled animation.' },
] as const

const catalogue = computed(() => createThemeTokenCatalogue(props.theme).filter(token => token.section === 'motion'))
const groups = computed(() => GROUPS.map(group => ({ ...group, tokens: catalogue.value.filter(token => token.group === group.id) })).filter(group => group.tokens.length))

const value = (token: ThemeToken) => themeTokenValue(props.theme, token) ?? ''

function set(token: ThemeToken, next: string) {
  emit('setValue', token.path.slice(1) as string[], next)
}

function setBezier(token: ThemeToken, index: number, next: string) {
  const values = parseBezier(value(token))
  if (!values) return
  values[index] = Number(next)
  set(token, formatBezier(values as Bezier))
}

function setAnimation(token: ThemeToken, part: 'duration' | 'easing', next: string) {
  const animation = parseAnimation(value(token))
  if (animation) set(token, formatAnimation({ ...animation, [part]: next } as Animation))
}

// An animation's duration or easing follows a motion token, or keeps its own literal.
function choices(group: 'duration' | 'ease', current: string) {
  const options = catalogue.value.filter(token => token.group === group).map(token => ({ label: `follows ${tokenKey(token)}`, value: `var(${token.variable})` }))
  if (group === 'ease') options.unshift({ label: 'linear', value: 'linear' })
  if (!options.some(option => option.value === current)) options.unshift({ label: `own: ${current}`, value: current })
  return options
}

function curve(token: ThemeToken) {
  const target = token.kind === 'reference' ? catalogue.value.find(candidate => candidate.variable === token.references) : token
  const values = target ? parseBezier(value(target)) : null
  return values ? bezierPath(values) : null
}

// Specimens are inline-only: utilities are !important in this layer and would win.
// Each one moves when Play is pressed, so nothing moves on its own.
const playing = ref(false)
const playKey = ref(0)
watch(playing, on => { if (on) playKey.value++ })

const trackStyle = { position: 'relative', flex: '1 1 auto', height: '0.75rem', borderRadius: 'var(--api-radius-xs)', backgroundColor: 'var(--api-fill-muted-default)' } as const

function easeDotStyle(token: ThemeToken) {
  return {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '9999px',
    backgroundColor: 'var(--api-fill-accent-on)',
    marginLeft: playing.value ? 'calc(100% - 0.75rem)' : '0',
    transitionProperty: 'margin-left',
    transitionDuration: '1s',
    transitionTimingFunction: `var(${apiName(token.variable)})`,
  }
}

function durationBarStyle(token: ThemeToken) {
  return {
    height: '100%',
    width: playing.value ? '100%' : '0',
    borderRadius: 'var(--api-radius-xs)',
    backgroundColor: 'var(--api-fill-accent-on)',
    transitionProperty: 'width',
    transitionDuration: `var(${apiName(token.variable)})`,
    transitionTimingFunction: 'linear',
  }
}

function animationStyle(token: ThemeToken) {
  const animation = `var(${apiName(token.variable)})`
  if (tokenKey(token) === 'skeleton') return { width: '100%', height: '0.75rem', borderRadius: 'var(--api-radius-xs)', animation }
  return { width: '1.5rem', height: '1.5rem', borderRadius: tokenKey(token) === 'spin' ? '0' : '9999px', backgroundColor: 'var(--api-fill-accent-on)', animation }
}
</script>
