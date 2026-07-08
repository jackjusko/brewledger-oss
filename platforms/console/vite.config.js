import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import prerender from 'vite-plugin-prerender-esm-fix'

// Backend server URL for proxy (must match server PORT, default 443)
const BACKEND_URL = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    prerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/tools', '/tools/bbl-to-case', '/tools/csv-search'],
      renderer: new prerender.PuppeteerRenderer({
        renderAfterTime: 10000,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
		executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      }),
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true }
    }
  }
})
