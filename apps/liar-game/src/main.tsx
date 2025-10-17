import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './styles/game-animations.css'
import App from './App.tsx'
import {ModalProvider} from './contexts/ModalContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
)
