import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const presentationCss = fileURLToPath(new URL('./assets/css/main.css', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: [presentationCss],
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
