import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 5173,
      host: true
    },
    build: {
      outDir: mode === 'production' ? 'dist' : `dist-${mode}`
    }
  }
})