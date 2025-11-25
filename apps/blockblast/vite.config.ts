import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = '/blockblast/';

const allowedHosts = ['zzirit.kr', 'www.zzirit.kr', 'localhost', '127.0.0.1', '118.45.132.139'];

const publicHost = process.env.VITE_PUBLIC_HOST;
const publicProtocol = process.env.VITE_PUBLIC_PROTOCOL ?? 'https';
const publicPort = Number(process.env.VITE_PUBLIC_PORT);
const publicOrigin = publicHost ? `${publicProtocol}://${publicHost}` : undefined;
const publicClientPort = publicPort ?? (publicProtocol === 'https' ? 443 : 80);

export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5178,
    host: true,
    allowedHosts,
    ...(publicOrigin ? { origin: publicOrigin } : {}),
    ...(publicHost
      ? {
          hmr: {
            host: publicHost,
            clientPort: publicClientPort,
            protocol: publicProtocol === 'https' ? 'wss' : 'ws'
          }
        }
      : {})
  }
});
