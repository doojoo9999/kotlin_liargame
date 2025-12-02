import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {StelliveThemeProvider} from '@stellive/ui'
import './styles/index.css'
import {initAnalytics} from './analytics'
import App from './App.tsx'

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? 'G-LN9LN30S0S'

initAnalytics(measurementId)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StelliveThemeProvider
      theme="dark"
      attachToDocument
      reducedMotion={prefersReducedMotion}
    >
      <App />
    </StelliveThemeProvider>
  </StrictMode>,
)
