<template>
  <div class="space-y-step-md p-step-md">
    <div class="rounded-card border border-edge-base-default bg-fill-base-default p-step-sm text-pen-base-default">
      <p class="text-caption text-pen-base-default">base</p>
      <div class="mt-step-xs rounded-card border border-edge-primary-default bg-fill-primary-default p-step-sm text-pen-primary-default shadow-raised">
        <p class="text-caption">primary</p>
        <div class="mt-step-xs rounded-card border border-edge-secondary-default bg-fill-secondary-default p-step-sm text-pen-secondary-default">
          <p class="text-caption">secondary</p>
          <div class="mt-step-xs rounded-card border border-edge-tertiary-default bg-fill-tertiary-default p-step-sm text-pen-tertiary-default">
            <p class="text-label">tertiary: each layer has its own fill, text and edge</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-step-xs" aria-label="Accent button states">
      <span
        v-for="state in buttonStates"
        :key="state.name"
        class="rounded-control border px-step-sm py-step-2xs text-label"
        :class="state.classes"
      >{{ state.name }}</span>
    </div>

    <div class="grid gap-step-xs sm:grid-cols-2">
      <span class="rounded-control border border-edge-input-default bg-fill-input-default px-step-sm py-step-2xs text-label text-pen-input-default">Input</span>
      <span class="rounded-control border border-edge-input-error bg-fill-input-error px-step-sm py-step-2xs text-label text-pen-input-error inset-ring-focus inset-ring-edge-input-error">Input with an error</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// A first, static look at the draft: the layer stack, the accent states and an input.
// Later editor sections replace it with live, interactive specimens.
const buttonStates = [
  { name: 'default', classes: 'border-edge-accent-default bg-fill-accent-default text-pen-accent-default' },
  { name: 'hover', classes: 'border-edge-accent-hover bg-fill-accent-hover text-pen-accent-hover' },
  { name: 'pressed', classes: 'border-edge-accent-pressed bg-fill-accent-pressed text-pen-accent-pressed' },
  { name: 'on', classes: 'border-edge-accent-on bg-fill-accent-on text-pen-accent-on inset-ring-focus inset-ring-edge-accent-on' },
  { name: 'selected', classes: 'border-edge-accent-selected bg-fill-accent-selected text-pen-accent-selected' },
  { name: 'disabled', classes: 'border-edge-accent-disabled bg-fill-accent-disabled text-pen-accent-disabled' },
] as const
</script>
