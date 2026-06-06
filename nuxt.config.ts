export default defineNuxtConfig({
  compatibilityDate: '2026-06-06',
  ssr: false,
  future: {
    compatibilityVersion: 4,
  },
  modules: ['@nuxt/eslint', '@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },
  runtimeConfig: {
    authHeaderUid: 'x-authentik-uid',
    authHeaderEmail: 'x-authentik-email',
    authHeaderUsername: 'x-authentik-username',
    authHeaderGroups: 'x-authentik-groups',
    adminGroup: 'citadel-admins',
  },
})
