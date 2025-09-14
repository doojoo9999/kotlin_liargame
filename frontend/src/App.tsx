import React, {useEffect, useState} from 'react';
import {RouterProvider} from 'react-router-dom';
import {Toaster} from 'sonner';
import {router} from './lib/router';
import {useAuthStore} from './stores/authStore';
import {useSessionManager} from './hooks/useSessionManager';
import {useGameWebSocket} from './hooks/useGameWebSocket';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { checkAuth } = useAuthStore();

  // 세션 자동 갱신 기능 활성화
  useSessionManager();

  // WebSocket 연결 초기화
  const { connect } = useGameWebSocket();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 인증 상태 확인
        await checkAuth();
        
        // 로그인 페이지에서는 WebSocket 연결을 시도하지 않음
        const currentPath = window.location.pathname;
        const isAuthenticatedUser = localStorage.getItem('isAuthenticated') === 'true';
        const isLoginPage = currentPath === '/' || currentPath === '/login';
        
        // WebSocket 연결 시도 (인증된 사용자이고 로그인 페이지가 아닌 경우만)
        if (isAuthenticatedUser && !isLoginPage) {
          try {
            await connect();
          } catch (error) {
            console.warn('WebSocket 연결 실패:', error);
            // WebSocket 연결 실패는 앱 초기화를 막지 않음
          }
        }
      } catch (error) {
        console.error('앱 초기화 실패:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [checkAuth, connect]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">앱을 초기화하는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        closeButton
      />
    </>
  );
}

export default App;
