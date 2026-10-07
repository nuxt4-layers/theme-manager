import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useThemeDraft } from '../app/composables/useThemeDraft'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'

function withDraft(theme = createCanonicalThemeDefinition()) {
  const scope = effectScope()
  const draft = scope.run(() => useThemeDraft(theme, { delay: 100 }))!
  return { draft, stop: () => scope.stop() }
}

describe('theme draft', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts valid, clean and previewable with the complete vocabulary', () => {
    const { draft, stop } = withDraft()
    expect(draft.validationError.value).toBeNull()
    expect(draft.dirty.value).toBe(false)
    expect(draft.preview.value?.modes.light['fill-accent']?.default).toBe('#0668a4ff')
    stop()
  })

  it('previews an edit once the delay has passed, and only then', async () => {
    const { draft, stop } = withDraft()
    const before = draft.preview.value
    draft.setColour('light', 'fill-accent', 'default', '#ff0000ff')
    await nextTick()
    expect(draft.dirty.value).toBe(true)
    expect(draft.preview.value).toBe(before)
    vi.advanceTimersByTime(100)
    expect(draft.preview.value?.modes.light['fill-accent']?.default).toBe('#ff0000ff')
    stop()
  })

  it('reports an invalid value instead of throwing, and keeps the last valid preview', async () => {
    const { draft, stop } = withDraft()
    const before = draft.preview.value
    expect(() => draft.setPresentationValue(['radii', 'card'], '')).not.toThrow()
    await nextTick()
    vi.advanceTimersByTime(100)
    expect(draft.validationError.value).toMatch(/radii\.card/)
    expect(draft.definition.value).toBeNull()
    expect(draft.result()).toBeNull()
    expect(draft.preview.value).toBe(before)

    draft.setPresentationValue(['radii', 'card'], '0.75rem')
    expect(draft.result()?.presentation.radii.card).toBe('0.75rem')
    expect(draft.validationError.value).toBeNull()
    stop()
  })

  it('completes an older theme for the preview without changing the saved definition', () => {
    const older = createCanonicalThemeDefinition()
    delete (older.presentation as { motion?: unknown }).motion
    const { draft, stop } = withDraft(older)
    expect(draft.result()?.presentation).not.toHaveProperty('motion')
    expect(draft.preview.value?.presentation).toHaveProperty('motion.ease.standard')
    stop()
  })

  it('applies Raw JSON only when it parses, reporting the error otherwise', async () => {
    const { draft, stop } = withDraft()
    draft.applyRaw('{ not json')
    expect(draft.rawError.value).toBeTruthy()
    expect(draft.model.name).toBe('Theme Manager Default')

    const next = { ...createCanonicalThemeDefinition(), name: 'Renamed' }
    draft.applyRaw(JSON.stringify(next))
    expect(draft.rawError.value).toBeNull()
    expect(draft.model.name).toBe('Renamed')
    await nextTick()
    vi.advanceTimersByTime(100)
    expect(draft.definition.value?.name).toBe('Renamed')
    stop()
  })

  it('creates missing groups when a value is set below them', () => {
    const older = createCanonicalThemeDefinition()
    delete (older.presentation as { borders?: unknown }).borders
    const { draft, stop } = withDraft(older)
    draft.setPresentationValue(['borders', 'widths', 'lg'], '5px')
    expect(draft.result()?.presentation.borders).toEqual({ widths: { lg: '5px' } })
    stop()
  })

  it('becomes clean again once marked as saved', async () => {
    const { draft, stop } = withDraft()
    draft.setPresentationValue(['radii', 'card'], '1rem')
    expect(draft.dirty.value).toBe(true)
    draft.markSaved()
    expect(draft.dirty.value).toBe(false)
    stop()
  })
})
