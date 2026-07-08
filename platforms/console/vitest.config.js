import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.js'],
    exclude: ['src/**/*.simple.test.js'],
    globals: false,
    testTimeout: 15000,
    hookTimeout: 10000,
  },
});
