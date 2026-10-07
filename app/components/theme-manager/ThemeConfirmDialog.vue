<template>
  <!-- showModal() makes the rest of the page inert, traps focus and closes on Escape
       (a cancel, so ask() resolves false). -->
  <dialog
    ref="dialog"
    :aria-labelledby="`${uid}-title`"
    :aria-describedby="`${uid}-body`"
    class="m-auto w-full max-w-md rounded-panel border border-edge-base-default bg-fill-base-default p-step-md text-pen-base-default shadow-modal backdrop:bg-fill-floor-default/70 backdrop:backdrop-blur-sm"
    @close="settle(dialog?.returnValue === 'confirm')"
  >
    <form method="dialog" class="space-y-step-sm">
      <h2 :id="`${uid}-title`" class="text-heading font-bold">{{ request?.title }}</h2>
      <p :id="`${uid}-body`" class="text-body">{{ request?.body }}</p>
      <div class="flex flex-wrap justify-end gap-step-xs">
        <!-- Cancel comes first and takes focus: the safe choice is the default. -->
        <button value="cancel" autofocus :class="[buttonClass, 'border-edge-base-default bg-fill-base-default text-pen-base-default hover:bg-fill-base-hover focus-visible:outline-edge-base-focus']">{{ request?.cancel ?? 'Cancel' }}</button>
        <button
          value="confirm"
          :class="[buttonClass, request?.danger
            ? 'border-edge-error-default bg-fill-error-default text-pen-error-default hover:border-edge-error-hover hover:bg-fill-error-hover hover:text-pen-error-hover focus-visible:outline-edge-error-focus'
            : 'border-edge-primary-default bg-fill-primary-default text-pen-primary-default hover:border-edge-primary-hover hover:bg-fill-primary-hover hover:text-pen-primary-hover focus-visible:outline-edge-primary-focus']"
        >{{ request?.confirm }}</button>
      </div>
    </form>
  </dialog>
</template>

<script setup lang="ts">
export interface ConfirmRequest {
  title: string
  body: string
  confirm: string
  cancel?: string
  /** Destructive: the confirm button takes the error role. */
  danger?: boolean
}

const uid = useId()
const dialog = ref<HTMLDialogElement | null>(null)
const request = ref<ConfirmRequest | null>(null)
const buttonClass = 'rounded-control border px-step-sm py-step-2xs text-label font-bold transition-[background-color,border-color,color] focus-visible:outline-focus focus-visible:outline-offset-focus'
let resolve: ((confirmed: boolean) => void) | null = null

function settle(confirmed: boolean) {
  resolve?.(confirmed)
  resolve = null
}

/** Opens the dialog and resolves true only when the confirm button is chosen. */
function ask(next: ConfirmRequest): Promise<boolean> {
  settle(false)
  request.value = next
  if (dialog.value) dialog.value.returnValue = ''
  dialog.value?.showModal()
  return new Promise(done => { resolve = done })
}

defineExpose({ ask })
</script>
