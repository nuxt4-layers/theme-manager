import { readFileSync, readdirSync } from 'node:fs'
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
  const components = read('app/components/theme-manager/ThemePreviewComponents.vue')
  const runtimeComposable = read('app/composables/useThemeRuntime.ts')
  const runtimePlugin = read('app/plugins/theme-runtime.client.ts')
  const runtimeMiddleware = read('app/middleware/theme-runtime.global.ts')

  it('ships Theme Manager-owned library and editor projections', () => {
    expect(library).toContain('Theme Library')
    expect(editor).toContain('Raw JSON')
    expect(editor).toContain('Preview')
    expect(editor).toContain('Delete Theme')
    // Every section has its own editor; no tab falls back to a list of text fields.
    for (const section of ['Colours', 'Typography', 'Scales', 'Shadows', 'Effects', 'Motion', 'Breakpoints']) expect(editor).toContain(`<ThemeManagerThemeEditor${section}`)
    expect(editor).not.toContain('presentationEntries')
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
    expect(editor).toContain('border-edge-primary-default bg-fill-primary-default font-bold text-pen-primary-default')
    expect(library).toContain('border-edge-primary-default bg-fill-primary-default px-4 py-2 font-medium text-pen-primary-default')
    expect(editor).toContain('border-edge-error-default bg-fill-error-default p-step-sm text-label text-pen-error-default')
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

  it('drives every previewed component state from platform semantics, not styling-only classes', () => {
    for (const semantic of [':aria-pressed="toggled"', 'aria-busy="true"', 'aria-disabled="true"', ':aria-selected="selectedTab === index"', 'role="listbox"', ':aria-selected="selectedOption === index"', 'aria-current="page"', 'aria-invalid="true"', 'disabled']) {
      expect(components).toContain(semantic)
    }
    for (const variant of ['hover:', 'active:', 'focus-visible:', 'aria-pressed:', 'aria-busy:', 'aria-disabled:', 'aria-selected:', 'aria-[current=page]:', 'aria-[invalid=true]:', 'disabled:', 'visited:']) {
      expect(components).toContain(variant)
    }
  })

  it('keeps previewed components keyboard operable with unique ids in each preview copy', () => {
    expect(components).toContain('const uid = useId()')
    expect(components).toContain(':tabindex="selectedTab === index ? 0 : -1"')
    expect(components).toContain('ArrowRight:')
    expect(components).toContain(':aria-activedescendant=')
    expect(components).toContain("@click=\"emit('editRole', card.role)\"")
  })

  it('never animates the focus ring, and stops transitions under reduced motion', () => {
    // A plain `transition` also fades outline-color, so the ring would fade in.
    expect(components).not.toMatch(/['" ]transition['" ]/)
    expect(components).toContain('transition-[background-color,border-color,color]')
    expect(components).toContain('motion-reduce:transition-none')
  })

  it('sizes the component grid by the preview width, not the window', () => {
    expect(components).toContain('class="@container"')
    expect(components).toContain('@min-[42rem]:grid-cols-2')
  })

  it('styles scale specimens only inline, since utilities are !important and would win', () => {
    const scales = read('app/components/theme-manager/ThemeEditorScales.vue')
    expect(read('assets/css/main.css')).toContain("@import 'tailwindcss' important;")
    expect(scales).toContain("const specimenClass = 'block'")
  })

  it('uses only literal container query sizes', () => {
    // Named container sizes (@sm:, @2xl:) read --container-*, which this pipeline maps to
    // var(--api-*); container queries cannot read var(), so Tailwind emits no rule at all.
    const componentDir = resolve(root, 'app/components/theme-manager')
    for (const file of readdirSync(componentDir).filter(name => name.endsWith('.vue'))) {
      const source = readFileSync(resolve(componentDir, file), 'utf8')
      expect(source, file).not.toMatch(/(?:^|[\s"'`])@(?:3xs|2xs|xs|sm|md|lg|xl|[2-7]xl):/m)
    }
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

  it('confirms deletion and unsaved-change loss in an accessible dialog, not confirm()', () => {
    const dialog = read('app/components/theme-manager/ThemeConfirmDialog.vue')
    expect(dialog).toContain('showModal()')
    expect(dialog).toContain('<form method="dialog"')
    expect(dialog).toMatch(/value="cancel" autofocus/)
    expect(editorPage).not.toMatch(/\bconfirm\(/)
    expect(editorPage).toContain('<ThemeManagerThemeConfirmDialog')
    expect(editorPage).toContain('onBeforeRouteLeave')
    expect(editorPage).toContain("addEventListener('beforeunload'")
    expect(editor).toContain('defineExpose({ dirty })')
  })

  it('follows the ARIA tabs pattern with one tab stop and arrow keys', () => {
    expect(editor).toContain('role="tabpanel"')
    expect(editor).toContain('aria-controls="theme-editor-panel"')
    expect(editor).toContain(':tabindex="activeTab === tab ? 0 : -1"')
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) expect(editor).toContain(key)
  })

  it('styles the editor through the semantic scales only', () => {
    for (const source of [editor, read('app/components/theme-manager/ThemeConfirmDialog.vue')]) {
      expect(source).not.toMatch(/\b(?:p|px|py|m|mb|mt|gap|space-y)-\d/)
      expect(source).not.toMatch(/\b(?:rounded-(?:lg|xl)|text-(?:xs|sm|2xl))\b/)
      expect(source).not.toMatch(/(?<![\w-])transition(?![-\w])/)
    }
  })
})
