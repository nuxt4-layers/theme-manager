<template>
  <span
    class="inline-flex items-center gap-step-3xs whitespace-nowrap rounded-pill border px-step-xs py-step-3xs text-caption"
    :class="tone"
    :title="title"
  >
    <span aria-hidden="true">{{ symbol }}</span>
    <span>{{ text }}</span>
    <span class="sr-only">{{ title }}</span>
  </span>
</template>

<script setup lang="ts">
import type { ContrastVerdict } from '../../../shared/colour-pairs'

// A contrast result never relies on colour alone (guide principle P2): each carries a
// symbol and words as well as its status colours.
const props = defineProps<{ verdict: ContrastVerdict; channel: string }>()

const symbol = computed(() => ({ pass: '✓', fail: '✕', exempt: '–', unchecked: '–' })[props.verdict.status])
const text = computed(() => {
  const verdict = props.verdict
  if ('reason' in verdict) return verdict.status === 'exempt' ? 'exempt' : 'not judged'
  return verdict.status === 'pass' ? `${verdict.ratio.toFixed(1)}:1` : `${verdict.ratio.toFixed(1)}:1, needs ${verdict.required}`
})
const title = computed(() => {
  const verdict = props.verdict
  if ('reason' in verdict) return `${props.channel}: ${verdict.reason}`
  return `${props.channel} contrast ${verdict.ratio.toFixed(2)} to 1 against the ${verdict.against}: ${verdict.status === 'pass' ? 'passes' : 'fails'} ${verdict.required} to 1`
})
const tone = computed(() => ({
  pass: 'border-edge-success-default bg-fill-success-default text-pen-success-default',
  fail: 'border-edge-error-default bg-fill-error-default text-pen-error-default',
  exempt: 'border-edge-muted-default bg-fill-muted-default text-pen-muted-default',
  unchecked: 'border-edge-muted-default bg-fill-muted-default text-pen-muted-default',
})[props.verdict.status])
</script>
