import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F8FAFC",
        text: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#64748B"
        },
        panel: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9",
          border: "#E2E8F0"
        },
        primary: {
          DEFAULT: "#2563EB",
          muted: "#EFF6FF",
          dark: "#1D4ED8"
        },
        accent: {
          amber: "#F59E0B"
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        body: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 12px 32px rgba(15, 23, 42, 0.08)",
        soft: "0 6px 18px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
