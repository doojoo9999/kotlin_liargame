import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

const basePath = "/roulette/";

const allowedHosts = [
  "zzirit.kr",
  "www.zzirit.kr",
  "localhost",
  "127.0.0.1",
  "118.45.132.139",
];

const publicHost = process.env.VITE_PUBLIC_HOST;
const publicProtocol = process.env.VITE_PUBLIC_PROTOCOL ?? "https";
const publicPort = Number(process.env.VITE_PUBLIC_PORT);
const publicOrigin = publicHost
  ? `${publicProtocol}://${publicHost}`
  : undefined;
const publicClientPort =
  publicPort ?? (publicProtocol === "https" ? 443 : 80);

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts,
    ...(publicOrigin ? {origin: publicOrigin} : {}),
    ...(publicHost
      ? {
        hmr: {
          host: publicHost,
          clientPort: publicClientPort,
          protocol: publicProtocol === "https" ? "wss" : "ws",
        },
      }
      : {}),
  },
});
