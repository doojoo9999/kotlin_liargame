import React from 'react';
import PropTypes from 'prop-types';
import {createBrowserRouter, Navigate, Outlet, RouterProvider, useNavigate} from 'react-router-dom';

import {Alert, Box, CircularProgress, CssBaseline} from './components/ui';
import '@mantine/core/styles.css';
import {Notifications} from '@mantine/notifications';

import {GameProvider, useGame} from './context/GameContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import GameRoomPage from './pages/GameRoomPage';
import LobbyPage from './pages/LobbyPage';
import LoginPage from './pages/LoginPage';
import LoginFailurePage from './pages/LoginFailurePage';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import {GameLoader} from './components/GameLoader';
import {lobbyLoader} from './loaders/lobbyLoader';

/**
 * 애플리케이션의 핵심 프로바이더와 인증 상태를 관리하는 레이아웃 컴포넌트.
 * 이 컴포넌트 하위의 모든 자식 라우트는 GameContext와 I18nContext에 접근할 수 있습니다.
 */
function AppLayout() {
    const navigate = useNavigate();
    return (
        <GameProvider navigate={navigate}>
            <Outlet />
        </GameProvider>
    );
}


function ProtectedRoute({ allowedRoles = ['user', 'admin'] }) {
  const { isAuthenticated, user, loading } = useGame()

  if (loading.auth) {
    return (
      <Box
        $display="flex"
        $justifyContent="center"
        $alignItems="center"
        $height="100vh"
        $flexDirection="column"
        $gap={2}
      >
        <CircularProgress size={60} />
        <Alert severity="info">인증 확인 중...</Alert>
      </Box>
    )
  }

  const isAuthorized = isAuthenticated && user && allowedRoles.includes(user.role)

  if (!isAuthorized) {
    // 관리자 페이지 접근 실패 시 관리자 로그인 페이지로, 그 외에는 일반 로그인 페이지로 이동
    const redirectTo = allowedRoles.includes('admin') && allowedRoles.length === 1 ? '/admin/login' : '/login'
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet /> // children 대신 Outlet을 렌더링하여 중첩 라우트를 표시
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.oneOf(['user', 'admin'])),
}

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />, // AppLayout 외부에 있어 GameProvider가 필요 없음
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/auth/login-failed',
    element: <LoginFailurePage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/',
    element: <AppLayout />, // 모든 앱의 공통 레이아웃 및 프로바이더
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          {
            path: 'admin',
            element: <AdminDashboard />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['user', 'admin']} />,
        children: [
          {
            index: true, // 기본 경로 (/)를 /lobby로 리디렉션
            element: <Navigate to="/lobby" replace />,
          },
          {
            path: 'lobby',
            element: <LobbyPage />,
            loader: lobbyLoader,
          },
          {
            path: 'game',
            element: <GameRoomPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/lobby" replace />,
    errorElement: <RouteErrorBoundary />
  }
])

function App() {
  return (
    <>
      <CssBaseline>
        <Notifications position="bottom-right" zIndex={2000} />
        <ErrorBoundary><RouterProvider router={router} fallbackElement={<GameLoader />} /></ErrorBoundary>
      </CssBaseline>
    </>
  )
}

export default App