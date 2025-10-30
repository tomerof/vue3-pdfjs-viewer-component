import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Example app config
export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  // Serve the library's assets folder at /assets for dev and include it in the example build
  publicDir: resolve(__dirname, '..', 'assets'),
  resolve: {
    alias: {
      // During local development, import the library source directly
      'vue3-pdf-viewer-component': resolve(__dirname, '..', 'index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from project root (for assets referenced via import.meta.url)
      allow: ['..'],
    },
  },
})