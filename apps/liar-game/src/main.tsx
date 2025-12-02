import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './styles/game-animations.css'
import {initAnalytics} from './analytics'
import App from './App.tsx'
import {ModalProvider} from './contexts/ModalContext'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? 'G-LN9LN30S0S'

initAnalytics(measurementId)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
)
