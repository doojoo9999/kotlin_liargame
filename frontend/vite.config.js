import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:20021',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://localhost:20021',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  // Add this section to fix the 'global is not defined' error
  define: {
    global: 'window',
  },
});
