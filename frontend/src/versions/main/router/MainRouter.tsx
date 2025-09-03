import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

// Main Version 페이지들
const MainLobbyPage = React.lazy(() => import('../pages/MainLobbyPage'));
const MainGameRoomPage = React.lazy(() => import('../pages/MainGameRoomPage'));
const MainGamePlayPage = React.lazy(() => import('../pages/MainGamePlayPage'));

const MainRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/main" element={<Navigate to="/main/lobby" replace />} />
      <Route path="/main/lobby" element={<MainLobbyPage />} />
      <Route path="/main/room/:roomId" element={<MainGameRoomPage />} />
      <Route path="/main/game/:gameNumber" element={<MainGamePlayPage />} />
      <Route path="*" element={<Navigate to="/main/lobby" replace />} />
    </Routes>
  );
};

export default MainRouter;
