import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './routes/AppLayout';
import HomePage from './routes/HomePage';
import PuzzlePlayPage from './routes/PuzzlePlayPage';
import PuzzleEditorPage from './routes/PuzzleEditorPage';
import SearchPage from './routes/SearchPage';
import LeaderboardPage from './routes/LeaderboardPage';
import ProfilePage from './routes/ProfilePage';
import CommunityPage from './routes/CommunityPage';
import MultiplayerLobbyPage from './routes/MultiplayerLobbyPage';
import AdminDashboardPage from './routes/AdminDashboardPage';
import NotFoundPage from './routes/NotFoundPage';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <NotFoundPage />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'puzzles/:puzzleId', element: <PuzzlePlayPage /> },
        { path: 'editor', element: <PuzzleEditorPage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 'leaderboard', element: <LeaderboardPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'community', element: <CommunityPage /> },
        { path: 'multiplayer', element: <MultiplayerLobbyPage /> },
        { path: 'admin', element: <AdminDashboardPage /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL ?? '/' }
);

export default router;
