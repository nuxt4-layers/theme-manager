export interface ThemeCapabilities {
  /** The host composed Theme storage: Themes can be listed, created, edited and saved. */
  storage: boolean
}

/**
 * What this composition supports. Without storage only the built-in default Theme
 * exists, so the pages offer no creating, editing or saving. Fails closed: if the
 * answer cannot be read, storage counts as absent.
 */
export async function useThemeCapabilities() {
  const { data } = await useFetch<ThemeCapabilities>('/api/theme-manager/capabilities', {
    key: 'theme-manager:capabilities',
    default: () => ({ storage: false }),
  })
  return { storage: computed(() => data.value?.storage === true) }
}
