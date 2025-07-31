import React from 'react'
import {createTheme, ThemeProvider} from '@mui/material/styles'
import {Alert, Box, CircularProgress, CssBaseline} from '@mui/material'
import {GameProvider, useGame} from './context/GameContext'
import LobbyPage from './pages/LobbyPage'
import GameRoomPage from './pages/GameRoomPage'
import ErrorBoundary from './components/ErrorBoundary'

/**
 * Main App component that serves as the root of the application.
 * Handles routing between lobby and game room pages based on global state.
 */

// Create Material-UI theme
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

/**
 * App Router component - handles page routing based on current page state
 */
function AppRouter() {
  const { currentPage, loading, error } = useGame()

  // Show global loading state
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
        <Alert severity="info">인증 중...</Alert>
      </Box>
    )
  }

  // Show global error state
  if (error.auth) {
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

  // Route to appropriate page
  switch (currentPage) {
    case 'room':
      return <GameRoomPage />
    case 'lobby':
    default:
      return <LobbyPage />
  }
}

/**
 * Main App component with providers and error boundary
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <GameProvider>
          <AppRouter />
        </GameProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App