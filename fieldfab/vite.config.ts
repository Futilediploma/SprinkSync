import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/fieldfab/', // Deploying to a subdirectory
  plugins: [react()],
});
