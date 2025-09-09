import {createBrowserRouter} from 'react-router-dom'
import {Layout} from '@/components/layout/Layout'
import {AuthLayout} from '@/components/layout/AuthLayout'
import {ProtectedRoute} from '@/components/auth/ProtectedRoute'

// Main Version Pages
import {MainLoginPage as LoginPage} from '@/versions/main/pages/LoginPage'
import {MainLobbyPage as LobbyPage} from '@/versions/main/pages/LobbyPage'
import {MainGamePage as GamePage} from '@/versions/main/pages/GamePage'
import {MainResultsPage as ResultsPage} from '@/versions/main/pages/ResultsPage'

// Error Pages
import {ErrorBoundary} from '@/components/common/ErrorBoundary'
import {NotFoundPage} from '@/components/common/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      }
    ]
  },
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "lobby",
        element: <ProtectedRoute><LobbyPage /></ProtectedRoute>,
      },
      {
        path: "game/:gameId",
        element: <ProtectedRoute><GamePage /></ProtectedRoute>,
      },
      {
        path: "results/:gameId", 
        element: <ProtectedRoute><ResultsPage /></ProtectedRoute>,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ]
  },
])

// Auth guard hook - import authStore where needed
export const useAuthGuard = () => {
  // This function should be used in components that need auth checking
  // The actual useAuthStore import should be done in the component
  return true // Placeholder - actual implementation in components
}

export const useGameGuard = (gameId?: string) => {
  const isAuthenticated = useAuthGuard()
  return isAuthenticated && !!gameId
}
