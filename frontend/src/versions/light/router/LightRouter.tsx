import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

// Light Version 페이지들
const LightLobbyPage = React.lazy(() => import('../pages/LightLobbyPage'));
const LightGameRoomPage = React.lazy(() => import('../pages/LightGameRoomPage'));
const LightGamePlayPage = React.lazy(() => import('../pages/LightGamePlayPage'));

const LightRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/light" element={<Navigate to="/light/lobby" replace />} />
      <Route path="/light/lobby" element={<LightLobbyPage />} />
      <Route path="/light/room/:roomId" element={<LightGameRoomPage />} />
      <Route path="/light/game/:gameNumber" element={<LightGamePlayPage />} />
      <Route path="*" element={<Navigate to="/light/lobby" replace />} />
    </Routes>
  );
};

export default LightRouter;
