/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/versions/main/**/*.{js,ts,jsx,tsx}", // Main 버전 전용
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 게임 특화 색상 추가
        "game-primary": "hsl(var(--game-primary))",
        "game-secondary": "hsl(var(--game-secondary))",
        "game-danger": "hsl(var(--game-danger))",
        "game-success": "hsl(var(--game-success))",
        "game-warning": "hsl(var(--game-warning))",
        "role-citizen": "hsl(var(--role-citizen))",
        "role-liar": "hsl(var(--role-liar))",
        "vote-selected": "hsl(var(--vote-selected))",
        "chat-user": "hsl(var(--chat-user))",
        "chat-system": "hsl(var(--chat-system))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // 게임 특화 애니메이션
        "vote-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
        "hint-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(59, 130, 246, 0)" },
          "50%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" },
        },
        "role-reveal": {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "timer-warning": {
          "0%, 100%": { backgroundColor: "hsl(var(--game-warning))", opacity: "0.3" },
          "50%": { backgroundColor: "hsl(var(--game-danger))", opacity: "0.7" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-to-top": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "vote-pulse": "vote-pulse 1s ease-in-out infinite",
        "hint-glow": "hint-glow 2s ease-in-out infinite",
        "role-reveal": "role-reveal 0.8s ease-in-out",
        "timer-warning": "timer-warning 1s ease-in-out infinite",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-out-to-top": "slide-out-to-top 0.3s ease-in",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
