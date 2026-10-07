<template>
  <input
    type="number"
    :value="value"
    :min="min"
    :max="max"
    :step="step ?? 0.05"
    :aria-label="label"
    class="w-full min-w-0 rounded-control border border-edge-input-default bg-fill-input-default px-step-2xs py-step-3xs text-label text-pen-input-default focus-visible:outline-focus focus-visible:outline-edge-input-focus"
    @input="set(($event.target as HTMLInputElement).value)"
  >
</template>

<script setup lang="ts">
// A unitless number (a weight, a line-height multiplier). An empty, half-typed or
// out-of-range number is ignored until it is valid.
const props = defineProps<{ value: string; label: string; min?: number; max?: number; step?: number }>()
const emit = defineEmits<{ update: [value: string] }>()

function set(text: string) {
  const value = Number(text)
  if (text.trim() === '' || !Number.isFinite(value)) return
  if ((props.min !== undefined && value < props.min) || (props.max !== undefined && value > props.max)) return
  emit('update', String(value))
}
</script>
