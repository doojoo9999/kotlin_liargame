import {createBrowserRouter, RouterProvider as DomRouterProvider} from 'react-router-dom';
import {AppProvider} from "./AppProvider";
import {GameRoomPage} from '../../pages/GameRoomPage';
import {LobbyPage} from '../../pages/LobbyPage';
import {LoginPage} from '../../pages/LoginPage';
import {RootLayout} from '../layouts/RootLayout';
import MainVersionApp from '../../versions/main/App';

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
  // Main Version 라우트 - 직접 임포트로 변경
  {
    path: '/main/*',
    element: <MainVersionApp />,
  },
]);

export function RouterProvider() {
    return (<AppProvider>
     <DomRouterProvider router={router} />
    </AppProvider>);
}
