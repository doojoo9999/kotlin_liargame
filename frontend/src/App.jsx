import React, {useEffect} from 'react'
import {BrowserRouter as Router, Navigate, Route, Routes, useNavigate} from 'react-router-dom'
import {createTheme, ThemeProvider} from '@mui/material/styles'
import {Alert, Box, CircularProgress, CssBaseline} from '@mui/material'
import {GameProvider, useGame} from './context/GameContext'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import GameRoomPage from './pages/GameRoomPage'
import ErrorBoundary from './components/ErrorBoundary'

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

function AppRouter() {
  const { isAuthenticated, currentPage, loading, error } = useGame()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      if (currentPage === 'room') {
        navigate('/game', { replace: true })
      } else if (currentPage === 'lobby') {
        navigate('/lobby', { replace: true })
      }
    }
  }, [currentPage, isAuthenticated, navigate])

  if (error.auth && !isAuthenticated) {
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
      <ErrorBoundary>
        <GameProvider>
          <Router>
            <AppRouter />
          </Router>
        </GameProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App