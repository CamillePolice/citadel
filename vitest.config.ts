import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/utils/**', 'server/utils/**'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
    },
  },
})
