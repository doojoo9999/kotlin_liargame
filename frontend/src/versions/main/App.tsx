import React from 'react';
import {Route, Routes} from 'react-router-dom';
import SimpleComponentDemo from './demo/SimpleComponentDemo';

// 기본 페이지 컴포넌트들을 인라인으로 정의하여 임포트 오류 방지
const MainLobbyPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Main Version 로비</h1>
      <p>Main Version 로비 페이지입니다.</p>
    </div>
  </div>
);

const MainGamePage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Main Version 게임</h1>
      <p>Main Version 게임 페이지입니다.</p>
    </div>
  </div>
);

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/demo" element={<SimpleComponentDemo />} />
        <Route path="/lobby" element={<MainLobbyPage />} />
        <Route path="/game/:gameNumber" element={<MainGamePage />} />
        <Route path="/" element={<MainLobbyPage />} />
      </Routes>
    </div>
  );
}

export default App;
