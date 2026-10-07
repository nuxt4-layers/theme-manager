import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// The presentation (main.css) plus the layer's own pages as Tailwind sources.
const layerCss = fileURLToPath(new URL('./assets/css/layer.css', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: [layerCss],
  runtimeConfig: {
    public: {
      themeManager: {
        creationTemplateId: '',
        creationOwnerType: '',
        creationOwnerId: '',
      },
    },
  },
  vite: {
    plugins: [tailwindcss() as never],
  },
})
