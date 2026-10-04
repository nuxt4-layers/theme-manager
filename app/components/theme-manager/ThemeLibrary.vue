<template>
  <section class="mx-auto max-w-6xl px-4 py-8" aria-labelledby="theme-library-title">
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="theme-library-title" class="text-3xl font-bold text-pen-base-default">Theme Library</h1>
        <p class="mt-1 text-pen-muted-default">Manage semantic presentation themes.</p>
      </div>
      <button type="button" class="rounded-lg border border-edge-primary-default bg-fill-primary-default px-4 py-2 font-medium text-pen-primary-default" @click="$emit('create')">
        Create Theme
      </button>
    </header>

    <p v-if="loading" role="status" class="py-12 text-center text-pen-muted-default">Loading themes…</p>
    <div v-else-if="error" role="alert" class="rounded-lg border border-edge-error-default bg-fill-error-default p-4 text-pen-error-default">{{ error }}</div>
    <div v-else-if="themes.length === 0" class="rounded-xl border border-dashed border-edge-base-default p-12 text-center">
      <h2 class="font-bold text-pen-base-default">No themes found</h2>
      <p class="mt-1 text-pen-muted-default">Create a theme to begin building a presentation profile.</p>
    </div>

    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <article v-for="theme in themes" :key="theme.id" class="flex flex-col rounded-xl border border-edge-base-default bg-fill-base-default p-5 shadow-sm-base">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-pen-base-default">{{ theme.name }}</h2>
            <p class="text-xs text-pen-muted-default">{{ theme.visibility }} · {{ theme.lifecycle }}</p>
          </div>
          <span v-if="selectedThemeId === theme.id" class="rounded-full bg-fill-success-default px-2 py-1 text-xs text-pen-success-default">Selected</span>
        </div>
        <p class="mb-5 flex-1 text-sm text-pen-muted-default">{{ theme.description || 'No description provided.' }}</p>
        <div class="flex gap-2">
          <button type="button" class="rounded-lg border border-edge-base-default px-3 py-2 text-sm text-pen-base-default" @click="$emit('select', theme.id)">Use</button>
          <button type="button" class="rounded-lg border border-edge-base-default px-3 py-2 text-sm text-pen-base-default" @click="$emit('edit', theme.id)">Edit</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ThemeSummary } from '../../../contracts'

defineProps<{
  themes: ThemeSummary[]
  selectedThemeId: string | null
  loading?: boolean
  error?: string | null
}>()

defineEmits<{
  create: []
  edit: [id: string]
  select: [id: string]
}>()
</script>
