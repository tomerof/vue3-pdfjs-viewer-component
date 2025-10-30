import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Example app config
export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: {
      // During local development, import the library source directly
      'vue3-pdfjs-viewer': resolve(__dirname, '..', 'index.ts'),
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