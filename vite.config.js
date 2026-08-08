import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: path.join(os.tmpdir(), 'vite-sms-frontend'),
  server: {
    proxy: {
      // Proxy API requests to the deployed backend to avoid CORS issues in dev
      '/api': {
        target: 'https://progress-backend-sqrr.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
