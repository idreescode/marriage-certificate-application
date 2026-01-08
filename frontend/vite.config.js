import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use root path for both dev and production
  base: '/',
  server: {
    port: 5173,
    open: true
  }
}))
