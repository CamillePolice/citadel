import { readFileSync } from 'node:fs'
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineNuxtConfig({
  compatibilityDate: '2026-06-06',
  ssr: false,
  future: {
    compatibilityVersion: 4,
  },
  modules: ['@nuxt/eslint', '@pinia/nuxt', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Citadel',
      short_name: 'Citadel',
      description: 'Portfolio LEGO — suivi de collection et P&L',
      theme_color: '#1a2236',
      background_color: '#1a2236',
      display: 'standalone',
      start_url: '/dashboard',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: false,
    },
  },
  runtimeConfig: {
    public: {
      version,
    },
    authHeaderUid: 'x-authentik-uid',
    authHeaderEmail: 'x-authentik-email',
    authHeaderUsername: 'x-authentik-username',
    authHeaderGroups: 'x-authentik-groups',
    adminGroup: 'citadel-admins',
  },
})
