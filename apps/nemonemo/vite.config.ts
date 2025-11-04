import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

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
        '@/components': '/src/components',
        '@/routes': '/src/routes',
        '@/store': '/src/store',
        '@/features': '/src/features',
        '@/lib': '/src/lib',
        '@/hooks': '/src/hooks'
      }
    }
  };
});
