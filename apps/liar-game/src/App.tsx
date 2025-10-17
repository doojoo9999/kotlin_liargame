import {useEffect, useState} from 'react';
import {RouterProvider} from 'react-router-dom';
import {Toaster} from 'sonner';
import {router} from './lib/router';
import {useAuthStore} from './stores/authStore';
import {useSessionManager} from './hooks/useSessionManager';
import {useGameWebSocket} from './hooks/useGameWebSocket';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // 세션 유지 및 자동 갱신
  useSessionManager();

  // WebSocket 연결 훅
  const { connect } = useGameWebSocket();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('앱 초기화 중 인증 점검 실패:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/' || currentPath === '/login';

    if (isAuthenticated && !isLoginPage) {
      connect().catch(error => {
        console.warn('WebSocket 자동 연결 실패:', error);
      });
    }
  }, [connect, isAuthenticated, isInitializing]);

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

