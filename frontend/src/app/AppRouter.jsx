import {Navigate, Route, Routes} from 'react-router-dom';
import {useAuthStore} from '@/stores/authStore';
import {GameRoomPage, LobbyPage, LoginPage} from '@/pages';

export const AppRouter = () => {
  const { isLoggedIn } = useAuthStore();

  return (
    <Routes>
      <Route 
        path="/" 
        element={isLoggedIn ? <Navigate to="/lobby" /> : <LoginPage />} 
      />
      <Route 
        path="/lobby" 
        element={isLoggedIn ? <LobbyPage /> : <Navigate to="/" />} 
      />
      <Route 
        path="/rooms/:roomId" 
        element={isLoggedIn ? <GameRoomPage /> : <Navigate to="/" />} 
      />
      {/* Add other routes here */}
    </Routes>
  );
};