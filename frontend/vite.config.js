import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/marriage_frontend/',   // 👈 THIS IS THE KEY LINE
  server: {
    port: 5173,
    open: true
  }
})
