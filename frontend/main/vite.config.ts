import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Main 버전은 3000 포트 사용 (주석과 일치하도록 수정)
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 백엔드 기본 포트로 통일
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080', // 백엔드 기본 포트로 통일
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
