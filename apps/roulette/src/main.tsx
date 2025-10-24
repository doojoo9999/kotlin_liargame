import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {StelliveThemeProvider} from '@stellive/ui'
import './index.css'
import App from './App.tsx'

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
