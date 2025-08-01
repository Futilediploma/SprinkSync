import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          console.log(`🔗 API Proxy: ${options.target}`)
        }
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
