<template>
  <div class="flex items-center gap-step-2xs rounded-control border border-edge-input-default bg-fill-input-default p-step-3xs focus-within:outline-focus focus-within:outline-offset-focus focus-within:outline-edge-input-focus">
    <span class="relative size-step-xl shrink-0 overflow-hidden rounded-tooltip border border-edge-base-default bg-fill-base-default">
      <span class="absolute inset-0" :style="{ backgroundColor: swatch }" aria-hidden="true" />
      <input
        type="color"
        class="absolute inset-0 size-full cursor-pointer opacity-0"
        :value="pickerValue"
        :aria-label="`${label}: colour picker`"
        @input="emit('update', withAlpha(($event.target as HTMLInputElement).value))"
      >
    </span>
    <input
      :value="value"
      maxlength="32"
      spellcheck="false"
      class="min-w-0 flex-1 bg-transparent px-step-3xs font-mono text-label text-pen-input-default outline-none"
      :aria-label="label"
      @input="emit('update', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ value: string; label: string }>()
const emit = defineEmits<{ update: [value: string] }>()

const HEX = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i

// The swatch shows the colour as stored, alpha included; the picker handles #rrggbb only.
const swatch = computed(() => (HEX.test(props.value) ? props.value : 'transparent'))
const pickerValue = computed(() => (HEX.test(props.value) ? props.value.slice(0, 7) : '#000000'))

// Keep the current alpha when a colour is picked, so translucent shadow colours stay translucent.
function withAlpha(picked: string) {
  return /^#[0-9a-f]{8}$/i.test(props.value) ? `${picked}${props.value.slice(7)}` : picked
}
</script>
