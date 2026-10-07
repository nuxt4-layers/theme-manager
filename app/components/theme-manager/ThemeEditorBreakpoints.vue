<template>
  <section :aria-labelledby="`${uid}-breakpoints`" class="space-y-step-xs">
    <h3 :id="`${uid}-breakpoints`" class="text-label font-bold text-pen-base-default">Breakpoints</h3>
    <p class="text-caption text-pen-muted-default">
      sm:, md:, lg: and the other screen prefixes. Breakpoints are compiled into media queries, so a Theme cannot change them;
      they are shown for reference. Content widths that follow a breakpoint (max-w-screen-*) are on the Spacing tab.
    </p>
    <table class="w-full text-label text-pen-base-default">
      <thead>
        <tr class="border-b border-edge-base-default text-left text-pen-muted-default">
          <th scope="col" class="py-step-3xs font-normal">Prefix</th>
          <th scope="col" class="py-step-3xs font-normal">Applies from</th>
          <th scope="col" class="py-step-3xs font-normal">In pixels</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[key, width] in breakpoints" :key="key" class="border-b border-edge-base-default">
          <th scope="row" class="py-step-3xs text-left font-mono font-normal">{{ key }}:</th>
          <td class="py-step-3xs font-mono">{{ width }}</td>
          <td class="py-step-3xs font-mono">{{ pixels(width) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { createCanonicalThemeDefinition } from '../../../shared/canonical-theme'
import { parseLength } from '../../../shared/css-value-parsers'

const uid = useId()
// The compiled values, not the Theme's: those are what the media queries use.
const breakpoints = Object.entries(createCanonicalThemeDefinition().presentation.responsive.breakpoints as Record<string, string>)

function pixels(width: string) {
  const length = parseLength(width)
  if (!length) return '—'
  return `${length.unit === 'rem' || length.unit === 'em' ? length.value * 16 : length.value}px`
}
</script>
