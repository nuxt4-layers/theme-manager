import { createThemeApplication, themeDefinitionToRuntime } from '../../shared/theme-runtime'

export default defineNuxtPlugin(async () => {
  const runtime = useThemeRuntime()
  const application = createThemeApplication(document.documentElement.style)
  const selectedThemeId = runtime.selectedThemeId.value

  // SSR middleware can resolve the persisted selection for server rendering, but
  // a fresh browser bootstrap must also be able to restore the runtime Theme.
  // The client is the authoritative owner of the document-level CSS variables.
  if (selectedThemeId && runtime.activeTheme.value?.id !== selectedThemeId) {
    try {
      const management = useThemeManagement()
      const theme = await management.loadTheme(selectedThemeId)
      runtime.activate(themeDefinitionToRuntime(theme))
    }
    catch (error) {
      runtime.failToDefault(error)
    }
  }

  watch(
    runtime.effectiveTheme,
    (theme) => {
      try {
        if (theme) application.apply(theme)
        else application.clear()
      }
      catch (error) {
        application.clear()
        runtime.failToDefault(error)
      }
    },
    { immediate: true },
  )
})
