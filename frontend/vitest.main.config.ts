import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import {resolve} from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/versions/main/__tests__/setup.ts'],
    include: [
      'src/versions/main/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/versions/main/**/*.{ts,tsx}'],
      exclude: [
        'src/versions/main/**/*.test.{ts,tsx}',
        'src/versions/main/**/*.spec.{ts,tsx}',
        'src/versions/main/**/__tests__/**',
        'src/versions/main/e2e/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/main": resolve(__dirname, "./src/versions/main"),
      "@/shared": resolve(__dirname, "./src/shared")
    }
  }
})
