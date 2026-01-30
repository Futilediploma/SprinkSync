import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/schedule-extractor/',
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
