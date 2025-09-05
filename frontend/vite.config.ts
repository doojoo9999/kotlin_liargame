import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./src"),
      "@/lib": resolve(process.cwd(), "./src/versions/main/lib"),
      "@/shared": resolve(process.cwd(), "./src/shared"),
      "@/main": resolve(process.cwd(), "./src/versions/main"),
      "@/light": resolve(process.cwd(), "./src/versions/light"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'phase4-demo': resolve(__dirname, 'phase4-demo.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'optimization': ['react-window'],
        },
      },
    },
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari12'],
    minify: 'esbuild',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:20021',
        changeOrigin: true,
      },
    },
  },

})