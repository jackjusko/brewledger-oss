import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  publicDir: 'src/public',
  server: {
    host: false, // You already have this for live reload
    watch: {
      // 1. Tell Vite to IGNORE these folders
      ignored: ['**/android/**', '**/ios/**', '**/dist/**'],
    }
  }
})
