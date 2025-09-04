import {createBrowserRouter, RouterProvider as DomRouterProvider} from 'react-router-dom';
import {AppProvider} from "./AppProvider";
import {GameRoomPage} from '../../pages/GameRoomPage';
import {LobbyPage} from '../../pages/LobbyPage';
import {LoginPage} from '../../pages/LoginPage';
import {RootLayout} from '../layouts/RootLayout';
import IntegratedGameDemo from '../../features/demo/IntegratedGameDemo';
import TestDemo from '../../features/demo/TestDemo';

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
  // Main Version 라우트 - 진짜 통합 데모로 복원
  {
    path: '/main/demo',
    element: <IntegratedGameDemo />,
  },
  {
    path: '/main/test',
    element: <TestDemo />,
  },
  {
    path: '/main',
    element: <IntegratedGameDemo />, // 기본 메인 경로
  },
]);

export function RouterProvider() {
    return (<AppProvider>
     <DomRouterProvider router={router} />
    </AppProvider>);
}
