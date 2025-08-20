import React from 'react';
import {Route, Routes} from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import LobbyPage from '@/pages/LobbyPage';

function App() {
  return (
    <div>
      <h1>Liar Game</h1>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby" element={<LobbyPage />} />
      </Routes>
    </div>
  );
}

export default App;
