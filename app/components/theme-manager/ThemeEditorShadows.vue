<template>
  <div class="@container space-y-step-md">
    <div class="flex flex-wrap items-center gap-step-sm">
      <div class="flex flex-wrap gap-step-2xs" role="group" aria-label="Shadow type">
        <button v-for="option in SHADOW_TYPES" :key="option.id" type="button" :class="choiceClass" :aria-pressed="type.id === option.id" @click="typeId = option.id">{{ option.label }}</button>
      </div>
      <div class="flex flex-wrap gap-step-2xs" role="group" aria-label="Shadow size">
        <button v-for="option in SHADOW_SIZES" :key="option" type="button" :class="choiceClass" :aria-pressed="size === option" @click="size = option">{{ option }}</button>
      </div>
    </div>

    <p v-if="steps.length" role="status" class="rounded-control border border-edge-warning-default bg-fill-warning-default px-step-sm py-step-2xs text-label text-pen-warning-default">
      <span aria-hidden="true">! </span>{{ steps.map(([small, large]) => `${small} and ${large}`).join(', ') }}: too close to tell apart (offset and blur within 1px).
    </p>

    <div class="grid gap-step-md @min-[48rem]:grid-cols-2">
      <section aria-label="Shape" class="space-y-step-sm">
        <h3 class="text-label font-bold text-pen-base-default">{{ type.label }} {{ size }}: shared by {{ shape.copies.length - shape.exceptions.length }} of {{ shape.copies.length }} role and mode copies</h3>

        <p v-if="!layers" class="text-label text-pen-muted-default">No copy of this size can be read as layers; edit the copies below as text.</p>
        <ol v-else class="space-y-step-xs">
          <li v-for="(layer, index) in layers" :key="index" class="rounded-card border border-edge-base-default bg-fill-base-default p-step-sm text-pen-base-default">
            <div class="mb-step-xs flex items-center justify-between gap-step-xs">
              <span class="text-label font-medium">Layer {{ index + 1 }}<span v-if="layer.inset" class="text-pen-muted-default"> · inset</span></span>
              <span class="flex gap-step-3xs">
                <button type="button" :class="smallButton" :disabled="index === 0" :aria-label="`Move layer ${index + 1} up`" @click="move(index, -1)">↑</button>
                <button type="button" :class="smallButton" :disabled="index === layers.length - 1" :aria-label="`Move layer ${index + 1} down`" @click="move(index, 1)">↓</button>
                <button type="button" :class="smallButton" :disabled="layers.length === 1" :aria-label="`Remove layer ${index + 1}`" @click="remove(index)">✕</button>
              </span>
            </div>
            <div class="grid grid-cols-2 gap-step-xs @min-[28rem]:grid-cols-4">
              <label v-for="part in lengthParts(layer)" :key="part" class="grid gap-step-3xs text-caption text-pen-muted-default">
                {{ partLabels[part] }}
                <span class="flex gap-step-3xs">
                  <input
                    type="number"
                    :step="layer[part]!.unit === 'rem' || layer[part]!.unit === 'em' ? 0.125 : 1"
                    :min="part === 'blur' ? 0 : undefined"
                    :value="layer[part]!.value"
                    :class="[fieldClass, 'w-full min-w-0']"
                    @input="setLengthText(index, part, ($event.target as HTMLInputElement).value, layer[part]!.unit)"
                  >
                  <select :value="layer[part]!.unit || 'px'" :class="fieldClass" :aria-label="`${partLabels[part]} unit`" @change="setLength(index, part, layer[part]!.value, ($event.target as HTMLSelectElement).value as Length['unit'])">
                    <option v-for="unit in units" :key="unit" :value="unit">{{ unit }}</option>
                  </select>
                </span>
              </label>
            </div>
            <fieldset class="mt-step-xs flex flex-wrap items-center gap-step-xs text-label">
              <legend class="sr-only">Layer {{ index + 1 }} colour</legend>
              <label class="flex items-center gap-step-3xs"><input type="radio" :name="`${uid}-colour-${index}`" :checked="layer.colour.kind === 'role'" @change="setColourKind(index, 'role')"> Each role's shadow colour</label>
              <label class="flex items-center gap-step-3xs"><input type="radio" :name="`${uid}-colour-${index}`" :checked="layer.colour.kind === 'literal'" @change="setColourKind(index, 'literal')"> Fixed colour</label>
              <ThemeManagerThemeColourField
                v-if="layer.colour.kind === 'literal'"
                class="min-w-step-3xl flex-1"
                :value="layer.colour.value"
                :label="`Layer ${index + 1} fixed colour`"
                @update="setLiteralColour(index, $event)"
              />
            </fieldset>
          </li>
        </ol>
        <div v-if="layers" class="flex flex-wrap items-center gap-step-xs">
          <button type="button" :class="choiceClass" :disabled="layers.length >= type.maxLayers" @click="add">+ Add layer</button>
          <span v-if="type.maxLayers === 1" class="text-caption text-pen-muted-default">Drop shadows take a single layer (filter: drop-shadow()).</span>
        </div>

        <label v-if="layers" class="grid gap-step-3xs text-label text-pen-base-default">
          As CSS (shown for the base role, light mode)
          <textarea :value="cssText" rows="2" spellcheck="false" :class="[fieldClass, 'font-mono']" @change="applyText(($event.target as HTMLTextAreaElement).value)" />
          <span v-if="textError" role="alert" class="text-caption text-pen-error-default"><span aria-hidden="true">✕ </span>{{ textError }}</span>
        </label>

        <section v-if="shape.exceptions.length" aria-label="Copies with their own shape" class="space-y-step-xs rounded-card border border-edge-info-default bg-fill-info-default p-step-sm text-pen-info-default">
          <h4 class="text-label font-bold">Copies with their own shape ({{ shape.exceptions.length }})</h4>
          <p class="text-caption">Editing the shared shape leaves these alone.</p>
          <div v-for="copy in shape.exceptions" :key="copy.key" class="grid gap-step-3xs">
            <label class="grid gap-step-3xs text-caption">{{ copy.role }}, {{ copy.mode }}
              <input :value="group[copy.key]" spellcheck="false" :class="[fieldClass, 'font-mono']" @change="emit('setValue', [...path, copy.key], ($event.target as HTMLInputElement).value)">
            </label>
            <button v-if="layers" type="button" :class="[choiceClass, 'justify-self-start']" @click="resetCopy(copy.key)">Reset to shared shape</button>
          </div>
        </section>
      </section>

      <section aria-label="Shadow preview" class="space-y-step-sm">
        <ThemeManagerThemePreviewScope v-for="mode in previewModes" :key="mode" :theme="preview" :mode="mode" class="space-y-step-sm rounded-panel border border-edge-base-default p-step-md">
          <p class="text-caption">{{ type.label }} {{ size }} · <span class="capitalize">{{ mode }}</span></p>
          <div class="grid place-items-center rounded-card p-step-lg">
            <div :class="specimenClass" :style="specimenStyle(size, 'base')">{{ type.id === 'text' ? 'Aa' : '' }}</div>
          </div>
          <div class="flex flex-wrap items-end gap-step-sm" aria-label="Scale">
            <figure v-for="step in SHADOW_SIZES" :key="step" class="grid justify-items-center gap-step-3xs">
              <div :class="[smallSpecimenClass, step === size ? 'outline-focus outline-edge-base-focus outline-offset-focus' : '']" :style="specimenStyle(step, 'base')">{{ type.id === 'text' ? 'Aa' : '' }}</div>
              <figcaption class="text-caption">{{ step }}</figcaption>
            </figure>
          </div>
          <div class="flex flex-wrap items-end gap-step-sm" aria-label="Roles">
            <figure v-for="role in previewRoles" :key="role" class="grid justify-items-center gap-step-3xs">
              <div :class="smallSpecimenClass" :style="specimenStyle(size, role)">{{ type.id === 'text' ? 'Aa' : '' }}</div>
              <figcaption class="text-caption">{{ role }}</figcaption>
            </figure>
          </div>
        </ThemeManagerThemePreviewScope>
      </section>
    </div>

    <section v-if="type.id === 'shadow'" aria-label="Elevation roles" class="space-y-step-xs">
      <h3 class="text-label font-bold text-pen-base-default">Elevation roles</h3>
      <div class="flex flex-wrap gap-step-sm">
        <label v-for="role in ELEVATION_ROLES" :key="role" class="grid gap-step-3xs text-label text-pen-base-default">
          shadow-{{ role }}
          <select :value="elevation(role)" :class="fieldClass" @change="setElevation(role, ($event.target as HTMLSelectElement).value as ShadowSize)">
            <option v-if="!elevation(role)" value="">custom</option>
            <option v-for="option in SHADOW_SIZES" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>
      </div>
    </section>

    <section aria-label="Shadow colours" class="space-y-step-xs">
      <h3 class="text-label font-bold text-pen-base-default">{{ type.channel === 'pen' ? 'Text-shadow' : 'Shadow' }} colours, {{ editingMode }} mode</h3>
      <p class="text-caption text-pen-muted-default">Each role's <code>shadow</code> state; translucent, so it reads as a tint of the surface.</p>
      <div class="grid gap-step-xs @min-[42rem]:grid-cols-2">
        <label v-for="role in roles" :key="role" class="grid grid-cols-[minmax(0,6rem)_1fr] items-center gap-step-xs text-label text-pen-base-default">
          {{ role }}
          <ThemeManagerThemeColourField
            :value="modes[editingMode]?.[`${type.channel}-${role}`]?.shadow ?? ''"
            :label="`${role} ${type.channel} shadow colour, ${editingMode}`"
            @update="emit('setColour', editingMode, `${type.channel}-${role}`, 'shadow', $event)"
          />
        </label>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatShadow, parseShadow, type Length, type ShadowLayer } from '../../../shared/css-value-parsers'
import { rolesOf, type ColourMode, type ColourModes } from '../../../shared/colour-pairs'
import { ELEVATION_ROLES, SHADOW_SIZES, SHADOW_TYPES, elevationReference, readShape, referencedSize, similarSteps, writeShape, type ShadowGroup, type ShadowSize } from '../../../shared/shadow-shapes'
import type { RuntimeTheme } from '../../../shared/theme-runtime'

const props = defineProps<{
  effects: Record<string, unknown>
  modes: ColourModes
  editingMode: ColourMode
  preview: RuntimeTheme | null
  previewModes: readonly ColourMode[]
}>()
const emit = defineEmits<{
  setValue: [path: string[], value: string]
  setColour: [mode: ColourMode, role: string, state: string, value: string]
}>()

const uid = useId()
const typeId = ref<(typeof SHADOW_TYPES)[number]['id']>('shadow')
const size = ref<ShadowSize>('md')
const type = computed(() => SHADOW_TYPES.find(option => option.id === typeId.value)!)
const path = computed(() => ['effects', type.value.group])
const group = computed(() => (props.effects[type.value.group] ?? {}) as ShadowGroup)
const shape = computed(() => readShape(group.value, type.value, size.value))
const layers = computed(() => shape.value.layers)
const steps = computed(() => similarSteps(group.value, type.value))
const roles = computed(() => rolesOf(props.modes, props.editingMode))
const previewRoles = ['base', 'primary', 'accent', 'success', 'warning', 'error'] as const
const units = ['px', 'rem', 'em'] as const
const partLabels = { x: 'X', y: 'Y', blur: 'Blur', spread: 'Spread' } as const
const baseContext = computed(() => ({ channel: type.value.channel, role: 'base', mode: 'light' as const }))
const cssText = computed(() => (layers.value ? formatShadow(layers.value, baseContext.value) : ''))
const textError = ref<string | null>(null)

const choiceClass = 'inline-flex items-center rounded-control border border-edge-base-default bg-fill-base-default px-step-sm py-step-3xs text-label text-pen-base-default hover:bg-fill-base-hover focus-visible:outline-focus focus-visible:outline-offset-focus focus-visible:outline-edge-base-focus aria-pressed:border-edge-primary-selected aria-pressed:bg-fill-primary-selected aria-pressed:text-pen-primary-selected disabled:cursor-not-allowed disabled:border-edge-muted-disabled disabled:bg-fill-muted-disabled disabled:text-pen-muted-disabled'
const smallButton = 'rounded-control border border-edge-base-default px-step-2xs text-caption text-pen-base-default hover:bg-fill-base-hover focus-visible:outline-focus focus-visible:outline-edge-base-focus disabled:cursor-not-allowed disabled:text-pen-muted-disabled'
const fieldClass = 'rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus'

function lengthParts(layer: ShadowLayer) {
  return layer.spread ? ['x', 'y', 'blur', 'spread'] as const : ['x', 'y', 'blur'] as const
}

/** Writes the edited shape to every copy that follows it. */
function commit(next: ShadowLayer[], include: readonly string[] = []) {
  for (const [key, value] of Object.entries(writeShape(shape.value, next, include))) emit('setValue', [...path.value, key], value)
}

function edit(change: (draft: ShadowLayer[]) => void) {
  if (!layers.value) return
  const next = structuredClone(toRaw(layers.value))
  change(next)
  commit(next)
}

function setLength(index: number, part: 'x' | 'y' | 'blur' | 'spread', value: number, unit: Length['unit']) {
  if (!Number.isFinite(value) || (part === 'blur' && value < 0)) return
  edit(next => { next[index]![part] = { value, unit: unit || 'px' } })
}

// An empty or half-typed number ('', '-') is ignored until it reads as a number.
function setLengthText(index: number, part: 'x' | 'y' | 'blur' | 'spread', text: string, unit: Length['unit']) {
  if (text.trim() !== '') setLength(index, part, Number(text), unit)
}

function setColourKind(index: number, kind: 'role' | 'literal') {
  edit(next => { next[index]!.colour = kind === 'role' ? { kind } : { kind, value: '#00000033' } })
}

function setLiteralColour(index: number, value: string) {
  edit(next => { next[index]!.colour = { kind: 'literal', value } })
}

function move(index: number, by: number) {
  edit(next => next.splice(index + by, 0, next.splice(index, 1)[0]!))
}

function remove(index: number) {
  edit(next => next.splice(index, 1))
}

function add() {
  edit(next => next.push({ ...structuredClone(next[next.length - 1]!), colour: { kind: 'role' } }))
}

function applyText(text: string) {
  const next = parseShadow(text, baseContext.value, { spread: type.value.spread })
  if (!next) {
    textError.value = `Not a shadow this editor can read; write layers as ${type.value.spread ? 'x y blur spread colour' : 'x y blur colour'}, separated by commas.`
    return
  }
  if (next.length > type.value.maxLayers) {
    textError.value = `${type.value.label} shadows take at most ${type.value.maxLayers} layer${type.value.maxLayers === 1 ? '' : 's'}.`
    return
  }
  textError.value = null
  commit(next)
}

function resetCopy(key: string) {
  if (layers.value) commit(structuredClone(toRaw(layers.value)), [key])
}

function elevation(role: string) {
  return referencedSize(group.value[`${role}-${props.editingMode}`], 'shadow', props.editingMode) ?? ''
}

function setElevation(role: string, next: ShadowSize) {
  for (const mode of ['light', 'dark'] as const) emit('setValue', ['effects', 'shadow', `${role}-${mode}`], elevationReference(next, mode))
}

// Specimens read --api-* names inside the preview scope, built at runtime, so they
// use inline styles rather than classes Tailwind would have to generate.
const specimenClass = computed(() => (type.value.id === 'text'
  ? 'text-heading font-bold text-pen-base-default'
  : 'size-step-3xl rounded-card bg-fill-base-default'))
const smallSpecimenClass = computed(() => (type.value.id === 'text'
  ? 'text-label font-bold text-pen-base-default'
  : 'size-step-xl rounded-control bg-fill-base-default'))

function specimenStyle(step: ShadowSize, role: string) {
  const token = (prefix: string) => `var(--api-${prefix}-${step}-${role})`
  switch (type.value.id) {
    case 'text': return { textShadow: token('text-shadow') }
    case 'drop': return { filter: `drop-shadow(${token('drop-shadow')})`, borderRadius: '0' }
    case 'inset': return { boxShadow: token('inset-shadow') }
    default: return { boxShadow: token('shadow') }
  }
}
</script>
