import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:3005',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://localhost:3005',
        ws: true
      }
    }
  }
})
