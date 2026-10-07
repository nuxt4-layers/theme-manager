import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('TM-7 management UI boundary', () => {
  const library = read('app/components/theme-manager/ThemeLibrary.vue')
  const editor = read('app/components/theme-manager/ThemeEditor.vue')
  const indexPage = read('app/pages/theme-manager/index.vue')
  const editorPage = read('app/pages/theme-manager/[id].vue')
  const draft = read('app/composables/useThemeDraft.ts')
  const previewScope = read('app/components/theme-manager/ThemePreviewScope.vue')
  const colours = read('app/components/theme-manager/ThemeEditorColours.vue')
  const colourField = read('app/components/theme-manager/ThemeColourField.vue')
  const contrastBadge = read('app/components/theme-manager/ThemeContrastBadge.vue')
  const runtimeComposable = read('app/composables/useThemeRuntime.ts')
  const runtimePlugin = read('app/plugins/theme-runtime.client.ts')
  const runtimeMiddleware = read('app/middleware/theme-runtime.global.ts')

  it('ships Theme Manager-owned library and editor projections', () => {
    expect(library).toContain('Theme Library')
    expect(editor).toContain('Raw JSON')
    expect(editor).toContain('Preview')
    expect(editor).toContain('Delete Theme')
    expect(editor).toContain('presentationEntries')
    expect(editor).not.toContain('until its specialised visual editor is introduced')
  })

  it('exposes and visibly distinguishes the selected editor tab', () => {
    expect(editor).toContain('role="tablist"')
    expect(editor).toContain('role="tab"')
    expect(editor).toContain(':aria-selected="activeTab === tab"')
    expect(editor).toContain('bg-fill-primary-default font-medium text-pen-primary-default')
    expect(editor).toContain('border-transparent text-pen-muted-default')
  })

  it('pairs semantic fill, pen and edge roles consistently in management states', () => {
    expect(editor).toContain('border-edge-primary-default bg-fill-primary-default px-4 py-2 font-bold text-pen-primary-default')
    expect(library).toContain('border-edge-primary-default bg-fill-primary-default px-4 py-2 font-medium text-pen-primary-default')
    expect(editor).toContain('border-edge-error-default bg-fill-error-default p-4 text-pen-error-default')
    expect(library).toContain('border-edge-error-default bg-fill-error-default p-4 text-pen-error-default')
    expect(editorPage).toContain('border-edge-error-default bg-fill-error-default p-4 text-pen-error-default')
    expect(editor).not.toContain('bg-fill-primary-default px-4 py-2 font-bold text-pen-base-default')
    expect(library).not.toContain('bg-fill-primary-default px-4 py-2 font-medium text-pen-base-default')
  })

  it('unwraps reactive Theme props before cloning editor state', () => {
    expect(editor).toContain('useThemeDraft(props.theme)')
    expect(draft).toContain('structuredClone(toRaw(initial))')
    expect(draft).not.toContain('structuredClone(initial)')
  })

  it('uses the common TM-5 preview engine rather than direct CSS mutation', () => {
    expect(editor).not.toContain('style.setProperty')
    expect(previewScope).not.toContain('style.setProperty')
    expect(previewScope).toContain('createThemeApplication(element.value!.style)')
    expect(editor).toContain("emit('preview'")
    expect(editorPage).toContain('@preview="management.previewTheme"')
  })

  it('previews the draft in scoped containers and never changes <html>', () => {
    expect(editor).toContain('<ThemeManagerThemePreviewScope')
    expect(previewScope).toContain(':data-theme-scope="mode"')
    for (const source of [editor, previewScope, draft]) {
      expect(source).not.toContain('document.documentElement')
      expect(source).not.toContain("classList.toggle('dark'")
    }
    expect(editor).toContain('const applyToApp = ref(false)')
  })

  it('edits colours as a state matrix with live contrast for each judged pair', () => {
    expect(editor).toContain('<ThemeManagerThemeEditorColours')
    expect(colours).toContain('roleContrast(props.modes, props.editingMode, activeRole.value)')
    expect(colours).toContain(':verdict="row.pen" channel="Pen"')
    expect(colours).toContain(':verdict="row.edge"')
    expect(colours).toContain('<ThemeManagerThemePreviewScope')
    // Specimens read --api-* (resolved inside the scope), never --ui-*.
    expect(colours).toContain('var(--api-${channel}-${activeRole.value}-${state})')
    expect(colours).not.toContain('var(--ui-')
  })

  it('never states a contrast result by colour alone', () => {
    expect(contrastBadge).toContain("{ pass: '✓', fail: '✕', exempt: '–', unchecked: '–' }")
    expect(contrastBadge).toContain('class="sr-only"')
  })

  it('gives the colour picker and the text field their own accessible names', () => {
    expect(colourField).toContain(':aria-label="`${label}: colour picker`"')
    expect(colourField).toContain(':aria-label="label"')
  })

  it('shows invalid drafts instead of throwing from input handlers', () => {
    expect(editor).toContain('v-if="validationError" role="alert"')
    expect(editor).toContain(':disabled="saving || !!rawError || !!validationError"')
    expect(editor).not.toContain('parseThemeDefinition')
  })

  it('applies the complete Theme Definition when a Theme is selected', () => {
    expect(indexPage).toContain('themeDefinitionToRuntime(theme)')
    expect(indexPage).not.toContain('legacyColourThemeToRuntime')
  })

  it('persists Theme selection for restoration across the complete consumer application', () => {
    expect(runtimeComposable).toContain("path: '/'")
    expect(runtimeMiddleware).toContain('management.loadTheme(selectedThemeId)')
    expect(runtimeMiddleware).toContain('runtime.activate(themeDefinitionToRuntime(theme))')
    expect(runtimeMiddleware).toContain('runtime.failToDefault(error)')
    expect(runtimePlugin).toContain('management.loadTheme(selectedThemeId)')
    expect(runtimePlugin).toContain('runtime.activate(themeDefinitionToRuntime(theme))')
    expect(runtimePlugin).toContain('runtime.activeTheme.value?.id !== selectedThemeId')
  })

  it('does not inherit legacy account/authentication composition assumptions', () => {
    const all = [library, editor, indexPage, editorPage].join('\n')
    expect(all).not.toContain("layout: 'account'")
    expect(all).not.toContain("middleware: 'authentication'")
    expect(all).not.toContain('/account/themes')
  })

  it('does not depend on a UI capability implementation', () => {
    const all = [library, editor, indexPage, editorPage].join('\n').toLowerCase()
    expect(all).not.toContain('ui-library')
    expect(all).not.toContain('@nuxt4-layers/ui')
  })

  it('does not revive a magic default Theme identifier or fabricate an owner', () => {
    expect(editorPage).not.toContain('default-fresh')
    expect(editorPage).not.toContain('dJKnu457dh387dgasdjgysaH')
    expect(editorPage).not.toContain("ownerId: 'unassigned'")
    expect(editorPage).toContain('creationTemplateId')
    expect(editorPage).toContain('creationOwnerId')
    expect(editorPage).toContain('completeThemeVocabulary')
    expect(editorPage).toContain('assertCompleteThemeVocabulary')
  })

  it('preserves the recovered management workflows', () => {
    expect(indexPage).toContain('@create=')
    expect(indexPage).toContain('@edit=')
    expect(indexPage).toContain('@select=')
    expect(editorPage).toContain('@save=')
    expect(editorPage).toContain('@delete=')
    expect(colourField).toContain('type="color"')
  })
})
