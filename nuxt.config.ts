export default defineNuxtConfig({
  compatibilityDate: '2026-06-06',
  future: {
    compatibilityVersion: 4,
  },
  modules: ['@nuxt/eslint'],
  runtimeConfig: {
    authHeaderUid: 'x-authentik-uid',
    authHeaderEmail: 'x-authentik-email',
    authHeaderUsername: 'x-authentik-username',
    authHeaderGroups: 'x-authentik-groups',
    adminGroup: 'citadel-admins',
  },
})
