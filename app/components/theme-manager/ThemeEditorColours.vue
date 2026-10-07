<template>
  <div class="space-y-step-md">
    <nav aria-label="Colour roles" class="space-y-step-xs">
      <div v-for="group in groups" :key="group.id" class="flex flex-wrap items-center gap-step-2xs">
        <span :id="`role-group-${group.id}`" class="min-w-step-3xl text-caption text-pen-muted-default">{{ group.label }}</span>
        <div class="flex flex-wrap gap-step-2xs" role="group" :aria-labelledby="`role-group-${group.id}`">
          <button
            v-for="role in group.roles"
            :key="role"
            type="button"
            class="inline-flex items-center gap-step-2xs rounded-pill border px-step-sm py-step-3xs text-label"
            :class="role === activeRole ? 'border-edge-primary-selected bg-fill-primary-selected text-pen-primary-selected' : 'border-edge-base-default bg-fill-base-default text-pen-base-default'"
            :aria-pressed="role === activeRole"
            @click="activeRole = role"
          >
            <span class="size-step-sm rounded-pill border border-edge-base-default" :style="{ backgroundColor: modes[editingMode]?.[`fill-${role}`]?.default }" aria-hidden="true" />
            {{ role }}
            <span v-if="failures(role)" class="text-caption">✕ {{ failures(role) }}</span>
          </button>
        </div>
      </div>
    </nav>

    <section :aria-label="`${activeRole} preview`" class="grid gap-step-sm" :class="previewModes.length > 1 ? 'xl:grid-cols-2' : ''">
      <ThemeManagerThemePreviewScope
        v-for="mode in previewModes"
        :key="mode"
        :theme="preview"
        :mode="mode"
        class="rounded-panel border border-edge-base-default p-step-sm"
      >
        <p class="mb-step-xs text-caption capitalize">{{ activeRole }} · {{ mode }}</p>
        <div class="flex flex-wrap gap-step-2xs">
          <span
            v-for="state in states"
            :key="state"
            class="rounded-control border-md px-step-xs py-step-3xs text-label"
            :style="specimenStyle(state)"
          >{{ state }}</span>
        </div>
      </ThemeManagerThemePreviewScope>
    </section>

    <div class="overflow-x-auto rounded-card border border-edge-base-default">
      <table ref="matrix" tabindex="-1" class="w-full table-fixed border-collapse text-left text-label focus-visible:outline-focus focus-visible:outline-edge-base-focus">
        <caption class="p-step-sm text-left text-pen-base-default">
          <span class="font-bold capitalize">{{ activeRole }}</span>, {{ editingMode }} mode: pen needs 4.5:1 and edge 3:1 on the state's own fill; the focus ring needs 3:1 on every page layer.
        </caption>
        <thead class="bg-fill-floor-default text-pen-floor-default">
          <tr>
            <th scope="col" class="w-step-3xl p-step-xs">State</th>
            <th scope="col" class="p-step-xs">Fill</th>
            <th scope="col" class="p-step-xs">Pen</th>
            <th scope="col" class="p-step-xs">Edge</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in contrast" :key="row.state" class="border-t border-edge-base-default">
            <th scope="row" class="p-step-xs pt-step-sm align-top font-medium text-pen-base-default">{{ row.state }}</th>
            <td v-for="channel in channels" :key="channel" class="space-y-step-3xs p-step-xs align-top">
              <ThemeManagerThemeColourField
                v-if="value(channel, row.state) !== undefined"
                :value="value(channel, row.state)!"
                :label="`${activeRole} ${channel}, ${row.state}, ${editingMode}`"
                @update="emit('set', editingMode, `${channel}-${activeRole}`, row.state, $event)"
              />
              <span v-else class="text-caption text-pen-muted-default">none</span>
              <!-- Each badge sits under the colour it judges: pen and edge against the fill. -->
              <ThemeManagerThemeContrastBadge v-if="channel === 'pen'" :verdict="row.pen" channel="Pen" />
              <ThemeManagerThemeContrastBadge v-if="channel === 'edge' && row.state !== 'shadow'" :verdict="row.edge" :channel="row.state === 'focus' ? 'Focus ring' : 'Edge'" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RuntimeTheme } from '../../../shared/theme-runtime'
import { COLOUR_STATES, ROLE_GROUPS, roleContrast, rolesOf, type ColourMode, type ColourModes } from '../../../shared/colour-pairs'

const props = defineProps<{
  modes: ColourModes
  editingMode: ColourMode
  preview: RuntimeTheme | null
  previewModes: readonly ColourMode[]
}>()
const emit = defineEmits<{ set: [mode: ColourMode, role: string, state: string, value: string] }>()

const channels = ['fill', 'pen', 'edge'] as const
const states = COLOUR_STATES.filter(state => state !== 'shadow')
// The selected role is shared with the editor, so a preview component can open its colours.
const activeRole = defineModel<string>('role', { default: 'accent' })
const matrix = ref<HTMLTableElement | null>(null)

/** Moves focus to the state matrix, e.g. after jumping here from a preview component. */
function focusMatrix() {
  matrix.value?.scrollIntoView({ block: 'nearest' })
  matrix.value?.focus()
}
defineExpose({ focusMatrix })

const roles = computed(() => rolesOf(props.modes, props.editingMode))
// Custom roles (not in the guide's fourteen) appear in their own group.
const groups = computed(() => {
  const known = ROLE_GROUPS.map(group => ({ ...group, roles: group.roles.filter(role => roles.value.includes(role)) }))
  const custom = roles.value.filter(role => !ROLE_GROUPS.some(group => (group.roles as readonly string[]).includes(role)))
  return [...known, ...(custom.length ? [{ id: 'custom', label: 'Custom', roles: custom }] : [])].filter(group => group.roles.length)
})

const contrast = computed(() => roleContrast(props.modes, props.editingMode, activeRole.value))

function value(channel: string, state: string) {
  return props.modes[props.editingMode]?.[`${channel}-${activeRole.value}`]?.[state]
}

function failures(role: string) {
  return roleContrast(props.modes, props.editingMode, role)
    .reduce((total, row) => total + [row.pen, row.edge].filter(result => result.status === 'fail').length, 0)
}

// Inline --api-* references, resolved inside each preview scope: Tailwind cannot
// generate a class for every role and state built at runtime.
function specimenStyle(state: string) {
  const name = (channel: string) => `var(--api-${channel}-${activeRole.value}-${state})`
  return { backgroundColor: name('fill'), color: name('pen'), borderColor: name('edge') }
}
</script>
