import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@api': path.resolve(__dirname, './src/api')
      }
    },
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 5173,
      host: true,
      proxy: {
        '/api': {
          target: (env.VITE_API_BASE_URL),
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: mode === 'production' ? 'dist' : `dist-${mode}`
    }
  }
})
