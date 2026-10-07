<template>
  <span v-if="length" class="flex gap-step-3xs">
    <input
      type="number"
      :step="length.unit === 'px' || !length.unit ? 1 : 0.125"
      :min="min"
      :value="length.value"
      :aria-label="label"
      :class="[fieldClass, 'w-full min-w-0']"
      @input="setNumber(($event.target as HTMLInputElement).value)"
    >
    <select :value="length.unit || 'px'" :aria-label="`${label} unit`" :class="fieldClass" @change="setUnit(($event.target as HTMLSelectElement).value as Length['unit'])">
      <option v-for="unit in units" :key="unit" :value="unit">{{ unit }}</option>
    </select>
  </span>
  <!-- Values this field cannot read as a length (calc(), keywords) stay plain text. -->
  <input v-else :value="value" spellcheck="false" :aria-label="label" :class="[fieldClass, 'w-full font-mono']" @change="emit('update', ($event.target as HTMLInputElement).value)">
</template>

<script setup lang="ts">
import { formatLength, parseLength, type Length } from '../../../shared/css-value-parsers'

const props = defineProps<{ value: string; label: string; min?: number }>()
const emit = defineEmits<{ update: [value: string] }>()

const units = ['px', 'rem', 'em'] as const
const fieldClass = 'rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus'
const length = computed(() => parseLength(props.value.trim()))

// An empty or half-typed number ('', '-') is ignored until it reads as a number.
function setNumber(text: string) {
  const value = Number(text)
  if (text.trim() === '' || !Number.isFinite(value) || (props.min !== undefined && value < props.min)) return
  emit('update', formatLength({ value, unit: length.value?.unit || 'px' }))
}

// Changing the unit keeps the size: rem and em convert to px at 16px (the browser
// default the scales assume), rounded to 4 decimal places.
const PX_PER_REM = 16
function setUnit(unit: Length['unit']) {
  if (!length.value) return
  const px = length.value.unit === 'px' || !length.value.unit ? length.value.value : length.value.value * PX_PER_REM
  const value = unit === 'px' ? px : px / PX_PER_REM
  emit('update', formatLength({ value: Math.round(value * 10000) / 10000, unit }))
}
</script>
