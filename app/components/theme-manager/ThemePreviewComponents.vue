<template>
  <!-- Columns follow the preview's own width (container query), not the window's:
       side by side, each preview is only half as wide. -->
  <div class="@container">
  <div class="grid gap-step-sm @min-[42rem]:grid-cols-2">
    <section v-for="card in cards" :key="card.id" class="rounded-card border border-edge-base-default bg-fill-base-default p-step-sm text-pen-base-default" :aria-labelledby="`${uid}-${card.id}`">
      <header class="mb-step-xs flex items-center justify-between gap-step-xs">
        <h3 :id="`${uid}-${card.id}`" class="text-label font-bold">{{ card.title }}</h3>
        <button
          type="button"
          class="rounded-control px-step-2xs text-caption text-pen-link-default underline hover:text-pen-link-hover focus-visible:outline-focus focus-visible:outline-offset-focus focus-visible:outline-edge-link-focus"
          :aria-label="`Edit the ${card.role} colours`"
          @click="emit('editRole', card.role)"
        >{{ card.role }} colours</button>
      </header>

      <!-- Buttons: hover, focus and pressed from :hover, :focus-visible and :active;
           on, loading and disabled from aria-pressed, aria-busy and aria-disabled. -->
      <div v-if="card.id === 'buttons'" class="flex flex-wrap gap-step-2xs">
        <button type="button" :class="accentButton">Button</button>
        <button type="button" :class="accentButton" :aria-pressed="toggled" @click="toggled = !toggled">Toggle {{ toggled ? 'on' : 'off' }}</button>
        <button type="button" :class="accentButton" aria-busy="true">Saving…</button>
        <button type="button" :class="accentButton" aria-disabled="true" @click.prevent>Unavailable</button>
      </div>

      <!-- Tabs: aria-selected on the chosen tab; arrow keys move between tabs (roving tabindex). -->
      <div v-else-if="card.id === 'tabs'">
        <div role="tablist" :aria-label="`${card.title} example`" class="flex flex-wrap gap-step-3xs border-b border-edge-primary-default" @keydown="moveTab">
          <button
            v-for="(tab, index) in tabs"
            :id="`${uid}-tab-${index}`"
            :key="tab"
            :ref="element => (tabElements[index] = element as HTMLButtonElement)"
            type="button"
            role="tab"
            :aria-selected="selectedTab === index"
            :aria-controls="`${uid}-panel`"
            :tabindex="selectedTab === index ? 0 : -1"
            :class="tabClass"
            @click="selectedTab = index"
          >{{ tab }}</button>
        </div>
        <p :id="`${uid}-panel`" role="tabpanel" :aria-labelledby="`${uid}-tab-${selectedTab}`" class="pt-step-xs text-label">{{ tabs[selectedTab] }} panel. Use the arrow keys to move between tabs.</p>
      </div>

      <!-- Options: a listbox whose chosen option carries aria-selected and a side marker. -->
      <ul
        v-else-if="card.id === 'options'"
        role="listbox"
        :aria-label="`${card.title} example`"
        :aria-activedescendant="`${uid}-option-${activeOption}`"
        tabindex="0"
        class="space-y-step-3xs rounded-control outline-none"
        @keydown="moveOption"
        @focus="listFocused = true"
        @blur="listFocused = false"
      >
        <li
          v-for="(option, index) in options"
          :id="`${uid}-option-${index}`"
          :key="option"
          role="option"
          :aria-selected="selectedOption === index"
          :class="[optionClass, listFocused && activeOption === index ? 'outline-focus outline-edge-secondary-focus' : '']"
          @click="selectedOption = activeOption = index"
        >{{ option }}</li>
      </ul>

      <!-- Links: the current page carries aria-current; a followed link turns :visited. -->
      <nav v-else-if="card.id === 'links'" :aria-label="`${card.title} example`" class="flex flex-wrap gap-step-2xs">
        <a href="#theme-preview" aria-current="page" :class="linkClass">Current page</a>
        <a :href="`#${uid}-elsewhere`" :class="linkClass">Another page</a>
        <a :href="`#${uid}-followed`" :class="linkClass">Follow me (then visited)</a>
      </nav>

      <!-- Form field: error from aria-invalid with a described message; disabled from disabled. -->
      <div v-else-if="card.id === 'form'" class="grid gap-step-xs">
        <label class="grid gap-step-3xs text-label">Name
          <input type="text" value="Calm Sky" :class="inputClass">
        </label>
        <label class="grid gap-step-3xs text-label">Email
          <input type="email" value="not an email" aria-invalid="true" :aria-describedby="`${uid}-email-error`" :class="inputClass">
          <span :id="`${uid}-email-error`" class="text-caption text-pen-error-default"><span aria-hidden="true">✕ </span>Enter an email address, like name@example.com</span>
        </label>
        <label class="grid gap-step-3xs text-label">Locked
          <input type="text" value="Not editable" disabled :class="inputClass">
        </label>
      </div>

      <!-- Status: each badge pairs its colours with an icon and words. -->
      <ul v-else class="flex flex-wrap gap-step-2xs">
        <li v-for="status in statuses" :key="status.role" class="inline-flex items-center gap-step-3xs rounded-pill border px-step-xs py-step-3xs text-caption" :class="status.classes">
          <span aria-hidden="true">{{ status.icon }}</span>{{ status.label }}
        </li>
      </ul>
    </section>
  </div>
  </div>
</template>

<script setup lang="ts">
// Live, keyboard-operable components rendered inside a preview scope, so every state of
// the draft can be reached by pointer and keyboard. States come from platform semantics
// (pseudo-classes and ARIA), never styling-only classes (guide principle P5). Class
// names are written out in full so Tailwind can generate them.
const emit = defineEmits<{ editRole: [role: string] }>()
const uid = useId()

const cards = [
  { id: 'buttons', title: 'Buttons', role: 'accent' },
  { id: 'tabs', title: 'Tabs', role: 'primary' },
  { id: 'options', title: 'Options', role: 'secondary' },
  { id: 'links', title: 'Links', role: 'link' },
  { id: 'form', title: 'Form field', role: 'input' },
  { id: 'status', title: 'Status', role: 'success' },
] as const

const focusRing = 'focus-visible:outline-focus focus-visible:outline-offset-focus'

const accentButton = [
  'rounded-control border px-step-sm py-step-2xs text-label',
  // Colours fade (duration-fast, the guide's transitions table); the focus ring never does.
  'transition-[background-color,border-color,color] duration-(--api-duration-fast) motion-reduce:transition-none',
  'border-edge-accent-default bg-fill-accent-default text-pen-accent-default',
  'hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover',
  'active:border-edge-accent-pressed active:bg-fill-accent-pressed active:text-pen-accent-pressed',
  `${focusRing} focus-visible:outline-edge-accent-focus`,
  'aria-pressed:border-edge-accent-on aria-pressed:bg-fill-accent-on aria-pressed:text-pen-accent-on aria-pressed:inset-ring-focus aria-pressed:inset-ring-edge-accent-on',
  // Pressed outranks on (guide precedence), so it is restated for a toggle that is on.
  'aria-pressed:active:bg-fill-accent-pressed aria-pressed:active:text-pen-accent-pressed',
  'aria-busy:cursor-progress aria-busy:border-edge-accent-loading aria-busy:bg-fill-accent-loading aria-busy:text-pen-accent-loading',
  'aria-disabled:cursor-not-allowed aria-disabled:border-edge-accent-disabled aria-disabled:bg-fill-accent-disabled aria-disabled:text-pen-accent-disabled',
].join(' ')

const tabs = ['Overview', 'Details', 'History']
const selectedTab = ref(0)
const tabElements: HTMLButtonElement[] = []
const tabClass = [
  '-mb-px border-b-lg border-transparent px-step-sm py-step-2xs text-label text-pen-primary-default',
  'hover:bg-fill-primary-hover hover:text-pen-primary-hover',
  `${focusRing} focus-visible:outline-edge-primary-focus`,
  'aria-selected:border-edge-primary-selected aria-selected:bg-fill-primary-selected aria-selected:text-pen-primary-selected',
].join(' ')

// Automatic activation: arrows move and select, wrapping at the ends; Home and End jump.
const tabKeys: Record<string, (current: number) => number> = {
  ArrowRight: current => (current + 1) % tabs.length,
  ArrowLeft: current => (current - 1 + tabs.length) % tabs.length,
  Home: () => 0,
  End: () => tabs.length - 1,
}

function moveTab(event: KeyboardEvent) {
  const next = tabKeys[event.key]
  if (!next) return
  event.preventDefault()
  selectedTab.value = next(selectedTab.value)
  tabElements[selectedTab.value]?.focus()
}

const options = ['Small', 'Medium', 'Large']
const selectedOption = ref(1)
const activeOption = ref(1)
// The listbox keeps focus itself; the active option shows the focus ring only while it does.
const listFocused = ref(false)
const optionClass = [
  'cursor-pointer rounded-control border-l-lg border-transparent px-step-xs py-step-3xs text-label',
  'bg-fill-secondary-default text-pen-secondary-default hover:bg-fill-secondary-hover hover:text-pen-secondary-hover',
  'aria-selected:border-edge-secondary-selected aria-selected:bg-fill-secondary-selected aria-selected:text-pen-secondary-selected',
].join(' ')

function moveOption(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    activeOption.value = (activeOption.value + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
  }
  else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    selectedOption.value = activeOption.value
  }
}

const linkClass = [
  'rounded-control border-b-lg border-transparent px-step-2xs py-step-3xs text-label underline',
  'text-pen-link-default hover:text-pen-link-hover visited:text-pen-link-visited active:text-pen-link-pressed',
  `${focusRing} focus-visible:outline-edge-link-focus`,
  'aria-[current=page]:border-edge-link-active aria-[current=page]:bg-fill-link-active aria-[current=page]:text-pen-link-active aria-[current=page]:no-underline',
].join(' ')

const inputClass = [
  'w-full min-w-0 rounded-control border px-step-xs py-step-2xs text-label',
  'border-edge-input-default bg-fill-input-default text-pen-input-default',
  'hover:border-edge-input-hover hover:bg-fill-input-hover',
  `${focusRing} focus-visible:outline-edge-input-focus`,
  'aria-[invalid=true]:border-edge-input-error aria-[invalid=true]:inset-ring-focus aria-[invalid=true]:inset-ring-edge-input-error',
  'disabled:cursor-not-allowed disabled:border-edge-input-disabled disabled:bg-fill-input-disabled disabled:text-pen-input-disabled',
].join(' ')

const toggled = ref(true)

const statuses = [
  { role: 'success', icon: '✓', label: 'Saved', classes: 'border-edge-success-default bg-fill-success-default text-pen-success-default' },
  { role: 'info', icon: 'i', label: 'Draft', classes: 'border-edge-info-default bg-fill-info-default text-pen-info-default' },
  { role: 'warning', icon: '!', label: 'Unsaved changes', classes: 'border-edge-warning-default bg-fill-warning-default text-pen-warning-default' },
  { role: 'error', icon: '✕', label: 'Failed', classes: 'border-edge-error-default bg-fill-error-default text-pen-error-default' },
  { role: 'notification', icon: '•', label: '3 new', classes: 'border-edge-notification-default bg-fill-notification-default text-pen-notification-default' },
] as const
</script>
