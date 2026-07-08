
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/backend/**/*.spec.js'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
  },
})
