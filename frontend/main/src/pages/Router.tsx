import {Navigate, Route, Routes} from 'react-router-dom';
import {ComponentDemoPage} from './ComponentDemoPage';
// import { LobbyPage } from './LobbyPage';
// import { GameRoomPage } from './GameRoomPage';
// import { LoginPage } from './LoginPage';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/demo" replace />} />
      <Route path="/demo" element={<ComponentDemoPage />} />
      {/*
      <Route path="/login" element={<LoginPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game/:gameNumber" element={<GameRoomPage />} />
      */}
    </Routes>
  );
}
