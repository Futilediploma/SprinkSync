import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const isCapacitor = process.env.CAPACITOR_BUILD === '1';
const devApiTarget = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  base: isCapacitor ? '/' : '/fieldfab/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
