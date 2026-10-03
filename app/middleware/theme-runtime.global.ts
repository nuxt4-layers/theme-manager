import { themeDefinitionToRuntime } from '../../shared/theme-runtime'

export default defineNuxtRouteMiddleware(async () => {
  const runtime = useThemeRuntime()
  const selectedThemeId = runtime.selectedThemeId.value

  if (!selectedThemeId) {
    runtime.useDefault()
    return
  }

  // A client-side navigation can retain the already resolved Theme. A fresh
  // application load has only the persisted selection id and must hydrate the
  // complete Theme Definition before runtime CSS overrides can be authoritative.
  if (runtime.activeTheme.value?.id === selectedThemeId) return

  try {
    const management = useThemeManagement()
    const theme = await management.loadTheme(selectedThemeId)
    runtime.activate(themeDefinitionToRuntime(theme))
  }
  catch (error) {
    runtime.failToDefault(error)
  }
})
