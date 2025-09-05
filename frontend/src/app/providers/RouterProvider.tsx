import React, {Suspense} from 'react';
import {createBrowserRouter, RouterProvider as DomRouterProvider} from 'react-router-dom';
import {AppProvider} from "./AppProvider";
import {GameRoomPage} from '../../pages/GameRoomPage';
import {LobbyPage} from '../../pages/LobbyPage';
import {LoginPage} from '../../pages/LoginPage';
import {RootLayout} from '../layouts/RootLayout';

// Lazy load the demo components for better performance
const EnhancedGameDemo = React.lazy(() => import('../../features/demo/EnhancedGameDemo'));
const IntegratedGameDemo = React.lazy(() => import('../../features/demo/IntegratedGameDemo'));
const TestDemo = React.lazy(() => import('../../features/demo/TestDemo'));

// Loading fallback component
const DemoLoadingFallback: React.FC = () => (
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
      <p style={{ margin: 0, fontSize: '16px', color: '#94a3b8' }}>게임 데모 로딩 중...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    // TODO: Add errorElement
    children: [
      {
        index: true,
        element: <LobbyPage />,
      },
      {
        path: '/lobby',
        element: <LobbyPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/game/:gameNumber',
        element: <GameRoomPage />,
      },
    ],
  },
  // Main Version 라우트 - Enhanced Demo 사용
  {
    path: '/main/demo',
    element: (
      <Suspense fallback={<DemoLoadingFallback />}>
        <EnhancedGameDemo />
      </Suspense>
    ),
  },
  {
    path: '/main/test',
    element: (
      <Suspense fallback={<DemoLoadingFallback />}>
        <TestDemo />
      </Suspense>
    ),
  },
  {
    path: '/main/integrated',
    element: (
      <Suspense fallback={<DemoLoadingFallback />}>
        <IntegratedGameDemo />
      </Suspense>
    ),
  },
  {
    path: '/main',
    element: (
      <Suspense fallback={<DemoLoadingFallback />}>
        <EnhancedGameDemo />
      </Suspense>
    ), // 기본 메인 경로
  },
]);

export function RouterProvider() {
    return (<AppProvider>
     <DomRouterProvider router={router} />
    </AppProvider>);
}
