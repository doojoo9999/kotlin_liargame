import {createBrowserRouter, RouterProvider as DomRouterProvider} from 'react-router-dom';
import {AppProvider} from "./AppProvider";
import {GameRoomPage} from '../../pages/GameRoomPage';
import {LobbyPage} from '../../pages/LobbyPage';
import {LoginPage} from '../../pages/LoginPage';
import {RootLayout} from '../layouts/RootLayout';

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
]);

export function RouterProvider() {
    return (<AppProvider>
     <DomRouterProvider router={router} />
    </AppProvider>);
}
