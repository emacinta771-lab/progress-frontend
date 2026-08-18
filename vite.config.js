import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    cacheDir: path.join(os.tmpdir(), 'vite-sms-frontend'),
    server: {
      proxy: {
        // In development, prefer the local backend so newly-added API routes
        // are available immediately. Override with VITE_DEV_PROXY_TARGET if needed.
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
