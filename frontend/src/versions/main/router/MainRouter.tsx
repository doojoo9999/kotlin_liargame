import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

// Main Version 페이지들
const MainLobbyPage = React.lazy(() => import('../pages/MainLobbyPage'));
const MainGameRoomPage = React.lazy(() => import('../pages/MainGameRoomPage'));
const MainGamePlayPage = React.lazy(() => import('../pages/MainGamePlayPage'));
const IntegratedGameDemo = React.lazy(() => import('../../../features/demo/IntegratedGameDemo'));

const MainRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/lobby" replace />} />
      <Route path="/lobby" element={<MainLobbyPage />} />
      <Route path="/demo" element={<IntegratedGameDemo />} />
      <Route path="/room/:roomId" element={<MainGameRoomPage />} />
      <Route path="/game/:gameNumber" element={<MainGamePlayPage />} />
      <Route path="*" element={<Navigate to="/lobby" replace />} />
    </Routes>
  );
};

export default MainRouter;
