export default defineNuxtRouteMiddleware(() => {
  const runtime = useThemeRuntime()

  // TM-5 preserves the persisted selection reference without inventing the
  // TM-6 repository/API resolver. If no resolved Theme is hydrated, CSS fallback
  // remains authoritative until the persistence work package supplies resolution.
  if (!runtime.selectedThemeId.value) runtime.useDefault()
})
