import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_APP_BASE ?? '/nemonemo/',
    plugins: [react()],
    server: {
      port: 4173,
      host: '0.0.0.0'
    },
    preview: {
      port: 4174
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/routes': path.resolve(__dirname, 'src/routes'),
        '@/store': path.resolve(__dirname, 'src/store'),
        '@/features': path.resolve(__dirname, 'src/features'),
        '@/lib': path.resolve(__dirname, 'src/lib'),
        '@/hooks': path.resolve(__dirname, 'src/hooks')
      }
    }
  };
});
