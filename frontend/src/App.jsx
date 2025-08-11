import React, {useEffect} from 'react'
import {BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate} from 'react-router-dom'
import {createTheme, ThemeProvider} from '@mui/material/styles'
import {Alert, Box, CircularProgress, CssBaseline} from '@mui/material'
import {GameProvider, useGame} from './context/GameContext'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import GameRoomPage from './pages/GameRoomPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider, {WebSocketMessageHandler} from './components/EnhancedToastSystem'
import LoginFailurePage from './pages/LoginFailurePage'
import {I18nProvider} from './i18n/i18n.jsx'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useGame()

  if (loading.auth) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Alert severity="info">인증 확인 중...</Alert>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminProtectedRoute({ children }) {
  const isUserAdmin = localStorage.getItem('isUserAdmin') === 'true'

  if (!isUserAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function AppRouter() {
  const { isAuthenticated, currentPage, loading, error } = useGame()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      // On successful auth, prefer a previously persisted safe returnTo
      import('./utils/redirect').then(({ consumePersistedReturnTo }) => {
        const to = consumePersistedReturnTo()
        if (to) {
          navigate(to, { replace: true })
          return
        }
        if (currentPage === 'room') {
          navigate('/game', { replace: true })
        } else if (currentPage === 'lobby') {
          navigate('/lobby', { replace: true })
        }
      })
    }
  }, [currentPage, isAuthenticated, navigate])

  if (error.auth && !isAuthenticated && location.pathname !== '/login' && location.pathname !== '/auth/login-failed') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          p: 2
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error.auth}
        </Alert>
      </Box>
    )
  }

  return (
    <Routes>
      {/* Public route - Login page */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/lobby" replace /> : <LoginPage />
        } 
      />

      {/* Login failed page */}
      <Route
        path="/auth/login-failed"
        element={<LoginFailurePage />}
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin/login" 
        element={<AdminLoginPage />} 
      />
      
      <Route 
        path="/admin" 
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/lobby" 
        element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/game" 
        element={
          <ProtectedRoute>
            <GameRoomPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/lobby" : "/login"} replace />
        } 
      />
      
      {/* Catch all - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/lobby" : "/login"} replace />
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <Router>
                  <AppRouter />
                </Router>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App