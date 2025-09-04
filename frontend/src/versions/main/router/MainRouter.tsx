import React, {Suspense} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

// Loading component for Suspense
const RouteLoadingFallback: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1419 0%, #1a1b1f 50%, #0f1419 100%)',
    color: '#ffffff'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTop: '4px solid #60a5fa',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      <p style={{ margin: 0, fontSize: '16px', color: '#94a3b8' }}>페이지 로딩 중...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Main Version 페이지들 (lazy loading 복원)
const MainLobbyPage = React.lazy(() => import('../pages/MainLobbyPage'));
const MainGameRoomPage = React.lazy(() => import('../pages/MainGameRoomPage'));
const MainGamePlayPage = React.lazy(() => import('../pages/MainGamePlayPage'));
const EnhancedGameDemo = React.lazy(() => import('../../../features/demo/EnhancedGameDemo'));

const MainRouter: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/lobby" replace />} />
        <Route path="/lobby" element={<MainLobbyPage />} />
        <Route path="/demo" element={<EnhancedGameDemo />} />
        <Route path="/room/:roomId" element={<MainGameRoomPage />} />
        <Route path="/game/:gameNumber" element={<MainGamePlayPage />} />
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </Suspense>
  );
};

export default MainRouter;
