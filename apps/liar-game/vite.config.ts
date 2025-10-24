import path from "path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {visualizer} from "rollup-plugin-visualizer";

const basePath = "/liargame/";

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
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    ...(process.env.ANALYZE
      ? [
        visualizer({
          filename: "dist/stats.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      ]
      : []),
  ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          router: ["react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
          ],
          query: ["@tanstack/react-query"],
          animation: ["framer-motion"],
          icons: ["lucide-react"],
          utils: ["clsx", "tailwind-merge"],
        },
      },
    },
    // Source maps for production debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: "es2020",
    // Compress output
    minify: "esbuild",
  },
  // Development optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "zustand",
      "framer-motion",
    ],
  },
  server: {
    port: 5173,
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
