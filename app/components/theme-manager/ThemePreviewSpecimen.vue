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

    <ThemeManagerThemePreviewComponents @edit-role="emit('editRole', $event)" />
  </div>
</template>

<script setup lang="ts">
// The layer stack, then live components for every interactive state of the draft.
const emit = defineEmits<{ editRole: [role: string] }>()
</script>
