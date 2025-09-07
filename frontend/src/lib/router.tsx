import {createBrowserRouter, Navigate} from 'react-router-dom'
import {Layout} from '@/components/layout/Layout'

// Main Version Pages
import {MainHomePage} from '@/versions/main/pages/HomePage'
import {MainLoginPage} from '@/versions/main/pages/LoginPage'
import {MainLobbyPage} from '@/versions/main/pages/LobbyPage'
import {MainGamePage} from '@/versions/main/pages/GamePage'
import {MainResultsPage} from '@/versions/main/pages/ResultsPage'

// Error Pages
import {ErrorBoundary} from '@/components/common/ErrorBoundary'
import {NotFoundPage} from '@/components/common/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/main" replace />,
      },
      {
        path: "main",
        children: [
          {
            index: true,
            element: <MainHomePage />,
          },
          {
            path: "login",
            element: <MainLoginPage />,
          },
          {
            path: "lobby/:sessionCode?",
            element: <MainLobbyPage />,
          },
          {
            path: "game/:gameId",
            element: <MainGamePage />,
          },
          {
            path: "results/:gameId",
            element: <MainResultsPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])

// Route Guards
export const useAuthGuard = () => {
  // Implementation for route protection
  const token = localStorage.getItem('auth-token')
  return !!token
}

export const useGameGuard = (gameId?: string) => {
  // Implementation for game-specific route protection
  const token = localStorage.getItem('auth-token')
  return !!token && !!gameId
}