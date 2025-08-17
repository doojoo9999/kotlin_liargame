import React from 'react'
import {createBrowserRouter, Navigate, RouterProvider} from 'react-router-dom'
import {Alert, Box, CircularProgress, CssBaseline} from './components/ui'
import {ThemeProvider} from './styles'
import {MantineProvider} from '@mantine/core'
import '@mantine/core/styles.css'
import {Notifications} from '@mantine/notifications'
import {gameTheme} from './styles/gameTheme'
import {GameProvider, useGame} from './context/GameContext'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import GameRoomPage from './pages/GameRoomPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import LoginFailurePage from './pages/LoginFailurePage'
import {I18nProvider} from './i18n/i18n.jsx'
import {lobbyLoader} from './loaders/lobbyLoader'


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useGame()

  if (loading.auth) {
    return (
      <Box
        $display="flex"
        $justifyContent="center"
        $alignItems="center"
        $height="100vh"
        $flexDirection="column"
        $gap={2}
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
        <GameProvider>
          <LoginPage />
        </GameProvider>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/auth/login-failed',
    element: (
      <I18nProvider>
        <GameProvider>
          <LoginFailurePage />
        </GameProvider>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/admin/login',
    element: (
      <I18nProvider>
        <GameProvider>
          <AdminLoginPage />
        </GameProvider>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/admin',
    element: (
      <I18nProvider>
        <GameProvider>
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        </GameProvider>
      </I18nProvider>
    ),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/lobby',
    element: (
      <I18nProvider>
        <GameProvider>
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        </GameProvider>
      </I18nProvider>
    ),
    loader: lobbyLoader,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/game',
    element: (
      <I18nProvider>
        <GameProvider>
          <ProtectedRoute>
            <GameRoomPage />
          </ProtectedRoute>
        </GameProvider>
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

function App() {
  return (
    <MantineProvider theme={gameTheme} defaultColorScheme="dark">
      <ThemeProvider>
        <CssBaseline>
            <Notifications position="bottom-right" zIndex={2000} />
          <ErrorBoundary><RouterProvider router={router} /></ErrorBoundary>
        </CssBaseline>
      </ThemeProvider>
    </MantineProvider>
  )
}

export default App