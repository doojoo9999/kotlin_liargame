import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0b1021',
        panel: '#11182d',
        highlight: '#1f2b4a',
        block: {
          red: '#ff6b6b',
          orange: '#ff9f43',
          yellow: '#ffd166',
          green: '#63e6be',
          blue: '#74c0fc',
          purple: '#b197fc',
          pink: '#f783ac'
        }
      },
      boxShadow: {
        glow: '0 10px 60px rgba(115, 131, 255, 0.25)',
        glass: '0 6px 24px rgba(0, 0, 0, 0.35)'
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Satoshi"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
