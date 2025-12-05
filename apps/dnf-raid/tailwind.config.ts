import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05060B",
        panel: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.12)",
          border: "rgba(255,255,255,0.18)"
        },
        neon: {
          cyan: "#30E0F2",
          violet: "#8B5CF6",
          amber: "#F59E0B"
        },
        grade: {
          start: "#0A0C1F",
          end: "#0B1F2F"
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        body: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        neon: "0 10px 40px rgba(48,224,242,0.25)"
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "hero-gradient":
          "linear-gradient(135deg, rgba(48,224,242,0.18), rgba(139,92,246,0.2))"
      }
    }
  },
  plugins: []
};

export default config;
