// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: ['@nuxt/ui'],
  
  ssr: true,
  
  app: {
    head: {
      title: 'OpenAPI Control Panel',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'OpenAPI Specification Management Dashboard' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  css: ['~/assets/css/voicenter-theme.css'],

  typescript: {
    strict: true,
    typeCheck: false // Disabled for build - use tsc separately if needed
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3001/api',
        changeOrigin: true
      }
    }
  },

  compatibilityDate: '2024-11-16'
})

