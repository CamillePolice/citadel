import type { Config } from 'tailwindcss'

export default {
  content: ['./app/components/**/*.{vue,ts}', './app/pages/**/*.vue', './app/app.vue', './app/error.vue'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        imperial: {
          bg: '#1a1625',
          surface: '#241f33',
          border: '#352d4d',
          muted: '#8b81a8',
          text: '#e6e1f2',
          accent: '#7c5cff',
        },
        gain: '#3ecf8e',
        loss: '#f0506e',
      },
    },
  },
  plugins: [],
} satisfies Config
