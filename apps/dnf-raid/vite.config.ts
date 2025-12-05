import path from "path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

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
const publicOrigin = publicHost ? `${publicProtocol}://${publicHost}` : undefined;
const publicClientPort = publicPort ?? (publicProtocol === "https" ? 443 : 80);

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4174,
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
