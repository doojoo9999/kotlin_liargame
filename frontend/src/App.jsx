import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import {useAuthStore} from './stores/authStore';
import {LoadingOverlay} from '@mantine/core';

// A wrapper for routes that require authentication.
function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Redirects to login page if not authenticated.
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // While the store is rehydrating from localStorage, show a loading screen.
  // This prevents rendering the wrong routes before the auth state is known.
  if (!_hasHydrated) {
    return <LoadingOverlay visible={true} overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        // If the user is already authenticated, redirect them from the login page to the lobby.
        element={isAuthenticated ? <Navigate to="/lobby" replace /> : <LoginPage />}
      />
      <Route
        path="/lobby"
        element={
          <PrivateRoute>
            <LobbyPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/room/:gameNumber"
        element={
          <PrivateRoute>
            <GameRoomPage />
          </PrivateRoute>
        }
      />
      {/* A catch-all route that redirects to the correct default page based on auth status. */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/lobby" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
