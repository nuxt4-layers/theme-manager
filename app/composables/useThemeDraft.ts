import { computed, onScopeDispose, reactive, ref, shallowRef, toRaw, watch } from 'vue'
import type { ThemeDefinition } from '../../contracts'
import { completeThemeVocabulary } from '../../shared/canonical-theme'
import { parseThemeDefinition } from '../../shared/theme-definition'
import { themeDefinitionToRuntime, type RuntimeTheme } from '../../shared/theme-runtime'

export interface ThemeDraftOptions {
  /** Milliseconds to wait after the last edit before validating and previewing. */
  delay?: number
}

const message = (error: unknown) => (error instanceof Error ? error.message : 'Invalid Theme Definition.')

/**
 * The theme editor's working copy. Edits never throw: an invalid draft shows its
 * error and the preview keeps the last valid theme until the draft is valid again.
 * The preview always carries the complete vocabulary, because a scoped preview only
 * follows the values set on the scope itself.
 */
export function useThemeDraft(initial: ThemeDefinition, options: ThemeDraftOptions = {}) {
  const delay = options.delay ?? 150
  const model = reactive(structuredClone(toRaw(initial))) as ThemeDefinition
  const baseline = ref(JSON.stringify(model))
  const raw = ref(JSON.stringify(model, null, 2))
  const rawError = ref<string | null>(null)
  const validationError = ref<string | null>(null)
  const valid = shallowRef<ThemeDefinition | null>(null)
  const preview = shallowRef<RuntimeTheme | null>(null)
  let editingRaw = false
  let timer: ReturnType<typeof setTimeout> | undefined

  function validate() {
    timer = undefined
    try {
      const parsed = parseThemeDefinition(structuredClone(toRaw(model)))
      valid.value = parsed
      validationError.value = null
      preview.value = themeDefinitionToRuntime(completeThemeVocabulary(parsed))
    }
    catch (error) {
      valid.value = null
      validationError.value = message(error)
    }
    if (!editingRaw) raw.value = JSON.stringify(model, null, 2)
    editingRaw = false
  }

  function schedule() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(validate, delay)
  }

  /** Validates now instead of waiting, e.g. before saving. */
  function flush() {
    if (timer) clearTimeout(timer)
    validate()
  }

  function setColour(mode: string, role: string, state: string, value: string) {
    const states = (model.modes as Record<string, Record<string, Record<string, string>>>)[mode]?.[role]
    if (states) states[state] = value
  }

  /** Sets a presentation value by its path below `presentation`, e.g. ['radii', 'card']. */
  function setPresentationValue(path: readonly string[], value: string) {
    let target = model.presentation as unknown as Record<string, unknown>
    for (const part of path.slice(0, -1)) {
      if (!target[part] || typeof target[part] !== 'object') target[part] = {}
      target = target[part] as Record<string, unknown>
    }
    target[path[path.length - 1]!] = value
  }

  /** Replaces the draft from the Raw JSON text, when it parses. */
  function applyRaw(text: string) {
    raw.value = text
    try {
      const next = parseThemeDefinition(JSON.parse(text))
      rawError.value = null
      editingRaw = true
      for (const key of Object.keys(model)) delete (model as unknown as Record<string, unknown>)[key]
      Object.assign(model, structuredClone(next))
    }
    catch (error) {
      rawError.value = message(error)
    }
  }

  function formatRaw() {
    applyRaw(raw.value)
    if (!rawError.value) raw.value = JSON.stringify(model, null, 2)
  }

  /** The validated definition to save, or null with validationError set. */
  function result(): ThemeDefinition | null {
    flush()
    return valid.value
  }

  function markSaved() {
    baseline.value = JSON.stringify(model)
  }

  watch(model, schedule, { deep: true })
  validate()
  onScopeDispose(() => timer && clearTimeout(timer))

  return {
    model,
    raw,
    rawError,
    validationError,
    preview,
    /** The last valid definition, or null while the draft is invalid. */
    definition: computed(() => valid.value),
    dirty: computed(() => JSON.stringify(model) !== baseline.value),
    setColour,
    setPresentationValue,
    applyRaw,
    formatRaw,
    flush,
    result,
    markSaved,
  }
}
