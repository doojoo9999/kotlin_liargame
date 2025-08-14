import React from 'react'
import {createBrowserRouter, Navigate, RouterProvider} from 'react-router-dom'
import {createTheme, ThemeProvider} from '@mui/material/styles'
import {Alert, Box, CircularProgress, CssBaseline} from '@mui/material'
import {GameProvider, useGame} from './context/GameContext'
import LoginPage from './pages/LoginPage'
import LobbyPageWithLoader from './pages/LobbyPageWithLoader'
import GameRoomPage from './pages/GameRoomPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import ToastProvider, {WebSocketMessageHandler} from './components/EnhancedToastSystem'
import LoginFailurePage from './pages/LoginFailurePage'
import {I18nProvider} from './i18n/i18n.jsx'
import {lobbyLoader} from './loaders/lobbyLoader'

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


// Create router configuration
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <AppRouterWrapper>
                  <LoginPage />
                </AppRouterWrapper>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/auth/login-failed',
    element: (
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <AppRouterWrapper>
                  <LoginFailurePage />
                </AppRouterWrapper>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/admin/login',
    element: (
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <AppRouterWrapper>
                  <AdminLoginPage />
                </AppRouterWrapper>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/admin',
    element: (
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <AppRouterWrapper>
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                </AppRouterWrapper>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/lobby',
    element: (
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <AppRouterWrapper>
                  <ProtectedRoute>
                    <LobbyPageWithLoader />
                  </ProtectedRoute>
                </AppRouterWrapper>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    ),
    loader: lobbyLoader,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/game',
    element: (
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <GameProvider>
              <WebSocketMessageHandler>
                <AppRouterWrapper>
                  <ProtectedRoute>
                    <GameRoomPage />
                  </ProtectedRoute>
                </AppRouterWrapper>
              </WebSocketMessageHandler>
            </GameProvider>
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/',
    element: <Navigate to="/lobby" replace />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '*',
    element: <Navigate to="/lobby" replace />,
    errorElement: <RouteErrorBoundary />
  }
])

// Wrapper component to provide routing context
function AppRouterWrapper({ children }) {
  return children
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App