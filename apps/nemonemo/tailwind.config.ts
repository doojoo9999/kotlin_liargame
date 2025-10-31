import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F8A70',
          foreground: '#FFFFFF'
        },
        accent: {
          DEFAULT: '#FF7A59',
          foreground: '#0F172A'
        }
      }
    }
  },
  plugins: [animatePlugin]
};

export default config;
