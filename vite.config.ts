import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// The backend has no CORS configuration, so in development every /api
// request is proxied to it. Point VITE_BACKEND_URL elsewhere if needed.
const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/api': { target: backend, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: backend, changeOrigin: true },
    },
  },
})
