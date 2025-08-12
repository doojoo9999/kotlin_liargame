import React from 'react';
import {BrowserRouter as Router, Navigate, Outlet, Route, Routes} from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import {Box, CircularProgress, CssBaseline, Typography} from '@mui/material';
import {useGame} from './stores/useGame'; // Zustand 훅으로 경로 변경
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import theme from './theme';
import AppLayout from './components/layout/AppLayout';

/**
 * This component protects routes requiring authentication.
 * It checks the user's authentication status and loading state.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useGame();

  if (loading.auth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>인증 정보를 확인하는 중...</Typography>
      </Box>
    );
  }

  return isAuthenticated ? <AppLayout><Outlet /></AppLayout> : <Navigate to="/login" replace />;
};

/**
 * This component defines all the application routes.
 */
const AppRoutes = () => {
    const { isAuthenticated } = useGame();
    return (
        <Routes>
            <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/lobby" replace /> : <LoginPage />}
            />
            
            <Route element={<ProtectedRoute />}>
                <Route path="/lobby" element={<LobbyPage />} />
                <Route path="/game/:gameNumber" element={<GameRoomPage />} />
            </Route>

            {/* Redirect any other path to the correct page based on auth status */}
            <Route 
                path="*" 
                element={<Navigate to={isAuthenticated ? "/lobby" : "/login"} replace />}
            />
        </Routes>
    );
}

/**
 * The main App component, which sets up the application structure.
 * GameProvider is no longer needed with Zustand.
 */
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* GameProvider is removed, Zustand handles state globally */}
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
};

export default App;
