<template>
  <section class="mx-auto max-w-7xl px-step-md py-step-lg" aria-labelledby="theme-library-title">
    <header class="mb-step-lg flex flex-wrap items-end justify-between gap-step-md">
      <div>
        <h1 id="theme-library-title" class="text-title font-bold text-pen-base-default">Theme Library</h1>
        <p class="mt-step-3xs text-body text-pen-muted-default">Manage semantic presentation themes.</p>
      </div>
      <button v-if="storage" type="button" :class="[buttonClass, primaryClass]" @click="$emit('create')">Create Theme</button>
    </header>

    <p v-if="!storage" role="note" class="mb-step-md rounded-card border border-edge-info-default bg-fill-info-default p-step-sm text-label text-pen-info-default">
      No theme store is configured, so themes cannot be created, edited or saved. The built-in default theme is in use.
    </p>

    <p v-if="loading" role="status" class="py-step-xl text-center text-body text-pen-muted-default">Loading themes…</p>
    <div v-else-if="error" role="alert" class="rounded-card border border-edge-error-default bg-fill-error-default p-step-sm text-label text-pen-error-default">{{ error }}</div>

    <div v-else class="grid gap-step-md md:grid-cols-2 lg:grid-cols-3">
      <!-- The built-in default ships with the layer: always available, never editable. -->
      <article :class="cardClass">
        <div class="mb-step-sm flex items-start justify-between gap-step-xs">
          <div>
            <h2 class="text-heading font-bold text-pen-base-default">Default Theme</h2>
            <p class="text-caption text-pen-muted-default">built in · Theme Manager {{ THEME_MANAGER_VERSION }} · read-only</p>
          </div>
          <span v-if="!selectedThemeId" :class="selectedClass">Selected</span>
        </div>
        <p class="mb-step-md flex-1 text-label text-pen-muted-default">The theme shipped with Theme Manager. It applies whenever no other theme is selected.</p>
        <div class="flex gap-step-xs">
          <button type="button" :class="[buttonClass, baseClass]" :aria-pressed="!selectedThemeId" @click="$emit('selectDefault')">Use</button>
        </div>
      </article>

      <article v-for="theme in themes" :key="theme.id" :class="cardClass">
        <div class="mb-step-sm flex items-start justify-between gap-step-xs">
          <div>
            <h2 class="text-heading font-bold text-pen-base-default">{{ theme.name }}</h2>
            <p class="text-caption text-pen-muted-default">{{ theme.visibility }} · {{ theme.lifecycle }} · v{{ theme.version }}<template v-if="isSystem(theme)"> · read-only</template></p>
          </div>
          <span v-if="selectedThemeId === theme.id" :class="selectedClass">Selected</span>
        </div>
        <p class="mb-step-md flex-1 text-label text-pen-muted-default">{{ theme.description || 'No description provided.' }}</p>
        <div class="flex gap-step-xs">
          <button type="button" :class="[buttonClass, baseClass]" :aria-pressed="selectedThemeId === theme.id" @click="$emit('select', theme.id)">Use</button>
          <button v-if="!isSystem(theme)" type="button" :class="[buttonClass, baseClass]" @click="$emit('edit', theme.id)">Edit<span class="sr-only"> {{ theme.name }}</span></button>
        </div>
      </article>
    </div>

    <p v-if="storage && !loading && !error && themes.length === 0" class="mt-step-md text-label text-pen-muted-default">No stored themes yet. Create a theme to begin building a presentation profile.</p>
  </section>
</template>

<script setup lang="ts">
import type { ThemeSummary } from '../../../contracts'
import { THEME_MANAGER_VERSION } from '../../../shared/theme-release'

defineProps<{
  themes: ThemeSummary[]
  selectedThemeId: string | null
  /** The host composed Theme storage; without it only the default theme is offered. */
  storage: boolean
  loading?: boolean
  error?: string | null
}>()

defineEmits<{
  create: []
  edit: [id: string]
  select: [id: string]
  selectDefault: []
}>()

// System themes ship with a release: they can be used, never edited here.
const isSystem = (theme: ThemeSummary) => theme.ownership.ownerType === 'system' || theme.visibility === 'system'

const buttonClass = 'rounded-control border px-step-sm py-step-2xs text-label transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:outline-offset-focus'
const baseClass = 'border-edge-base-default bg-fill-base-default text-pen-base-default hover:bg-fill-base-hover focus-visible:outline-edge-base-focus aria-pressed:border-edge-primary-selected aria-pressed:bg-fill-primary-selected aria-pressed:text-pen-primary-selected'
const primaryClass = 'border-edge-primary-default bg-fill-primary-default font-bold text-pen-primary-default hover:border-edge-primary-hover hover:bg-fill-primary-hover hover:text-pen-primary-hover focus-visible:outline-edge-primary-focus'
const cardClass = 'flex flex-col rounded-card border border-edge-base-default bg-fill-base-default p-step-md shadow-raised'
const selectedClass = 'rounded-control border border-edge-success-default bg-fill-success-default px-step-2xs py-step-3xs text-caption text-pen-success-default'
</script>
