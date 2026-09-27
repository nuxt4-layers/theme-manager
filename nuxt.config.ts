import tailwindcss from '@tailwindcss/vite'
import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: [resolve('./assets/css/main.css')],
  vite: {
    plugins: [tailwindcss()],
  },
})
