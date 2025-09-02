import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:20021'

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
        '/ws': { // WebSocket 프록시 (SockJS handshake 포함)
          target: apiBase,
          ws: true,
          changeOrigin: true,
        }
      },
    },
  }
})
