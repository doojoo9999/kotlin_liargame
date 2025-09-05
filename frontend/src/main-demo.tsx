import React from 'react';
import ReactDOM from 'react-dom/client';
import MainApp from './versions/main/App';

// URL 파라미터로 버전 선택 가능
const urlParams = new URLSearchParams(window.location.search);
const version = urlParams.get('version') || 'main';

// Main Version을 기본으로 로드
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
