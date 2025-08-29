import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useUserStore} from '../../../shared/stores/userStore';
import {useChatStore} from '../../chat/stores/chatStore';
import {socketManager} from '../../../shared/socket/SocketManager';
import {logout} from '../api/logout';

export const useLogoutMutation = () => {
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const clearChatMessages = useChatStore((state) => state.actions.clearMessages);
  const unsubscribeFromChat = useChatStore((state) => state.actions.unsubscribeFromChat);
  const queryClient = useQueryClient();

  const performCompleteLogout = () => {
    console.log('[Logout] Starting complete logout process...');

    // 1. WebSocket 연결 해제
    try {
      unsubscribeFromChat();
      socketManager.disconnect();
      console.log('[Logout] WebSocket connections terminated');
    } catch (error) {
      console.warn('[Logout] Failed to disconnect WebSocket:', error);
    }

    // 2. Zustand 스토어 초기화
    try {
      clearUser();
      clearChatMessages();
      console.log('[Logout] Zustand stores cleared');
    } catch (error) {
      console.warn('[Logout] Failed to clear stores:', error);
    }

    // 3. React Query 캐시 초기화
    try {
      queryClient.clear();
      queryClient.invalidateQueries();
      console.log('[Logout] React Query cache cleared');
    } catch (error) {
      console.warn('[Logout] Failed to clear React Query cache:', error);
    }

    // 4. 브라우저 저장소 초기화
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('[Logout] Browser storage cleared');
    } catch (error) {
      console.warn('[Logout] Failed to clear browser storage:', error);
    }

    // 5. 쿠키 삭제
    try {
      // 모든 쿠키 삭제
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
      });
      console.log('[Logout] Cookies cleared');
    } catch (error) {
      console.warn('[Logout] Failed to clear cookies:', error);
    }

    // 6. 페이지 이동
    console.log('[Logout] Complete logout process finished, navigating to login');
    navigate('/login', { replace: true });

    // 페이지 새로고침 제거 - 이미 모든 상태가 정리되었으므로 불필요
  };

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      console.log('[Logout] API logout successful');
      performCompleteLogout();
    },
    onError: (error) => {
      // API 로그아웃이 실패해도 클라이언트 측 완전 정리 수행
      console.error('[Logout] API logout failed, performing client-side cleanup:', error);
      performCompleteLogout();
    },
  });
};
