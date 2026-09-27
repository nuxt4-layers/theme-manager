import { createThemeApplication } from '../../shared/theme-runtime'

export default defineNuxtPlugin(() => {
  const runtime = useThemeRuntime()
  const application = createThemeApplication(document.documentElement.style)

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
