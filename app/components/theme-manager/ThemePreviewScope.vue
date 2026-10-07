<template>
  <div ref="element" :data-theme-scope="mode" class="bg-fill-floor-default text-pen-floor-default">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { createThemeApplication, type RuntimeTheme, type ThemeApplication } from '../../../shared/theme-runtime'

// Renders its content with a theme without touching <html>: the engine writes the
// theme's --ui-* values on this element, and theme-scope.css re-declares the --api-*
// mappings on [data-theme-scope], so everything inside resolves them here, in `mode`.
const props = defineProps<{ theme: RuntimeTheme | null; mode: 'light' | 'dark' }>()

const element = ref<HTMLElement | null>(null)
let application: ThemeApplication | null = null

function render(theme: RuntimeTheme | null) {
  if (!application) return
  try {
    if (theme) application.apply(theme)
    else application.clear()
  }
  catch {
    // A theme the engine rejects falls back to the bundled values, as on <html>.
    application.clear()
  }
}

onMounted(() => {
  application = createThemeApplication(element.value!.style)
  render(props.theme)
})
watch(() => props.theme, render)
onBeforeUnmount(() => application?.clear())
</script>
