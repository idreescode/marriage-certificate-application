import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root path for local dev ('serve'), subdirectory for production build
  base: command === 'serve' ? '/' : '/marriage_frontend/',
  server: {
    port: 5173,
    open: true
  }
}))
