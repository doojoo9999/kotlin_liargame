import {useCallback, useEffect, useRef} from 'react';
import {useAuthStore} from '../stores/authStore';
import {useModal} from '@/contexts/ModalContext';

// 세션 갱신 간격 (15분)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

// 사용자 활동 감지 이벤트들
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
const MODAL_LOGOUT_GRACE_MS = 15 * 1000;

export function useSessionManager() {
  const { isAuthenticated, checkAuth, logout } = useAuthStore();
  const { isAnyModalOpen, activeModals } = useModal();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pendingLogoutRef = useRef(false);
  const deferredLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 사용자 활동 감지
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  const cancelDeferredLogout = useCallback(() => {
    pendingLogoutRef.current = false;
    if (deferredLogoutTimerRef.current) {
      clearTimeout(deferredLogoutTimerRef.current);
      deferredLogoutTimerRef.current = null;
    }
  }, []);

  const requestDeferredLogout = useCallback(() => {
    if (pendingLogoutRef.current && deferredLogoutTimerRef.current) {
      return;
    }

    pendingLogoutRef.current = true;
    if (deferredLogoutTimerRef.current) {
      clearTimeout(deferredLogoutTimerRef.current);
    }

    deferredLogoutTimerRef.current = setTimeout(() => {
      deferredLogoutTimerRef.current = null;
      if (!pendingLogoutRef.current) {
        return;
      }
      pendingLogoutRef.current = false;
      void logout();
    }, MODAL_LOGOUT_GRACE_MS);
  }, [logout]);

  // 세션 갱신 함수
  const refreshSession = useCallback(async () => {
    if (!isAuthenticated) return;

    // 모달이 열려있는 경우 세션 갱신을 연기
    if (isAnyModalOpen) {
      console.log('[SessionManager] Deferring session refresh - modal open:', Array.from(activeModals));
      return;
    }

    try {
      await checkAuth();
      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Session refresh failed:', error);

      // 모달이 열려있는 경우 로그아웃도 연기 (사용자가 작업을 잃지 않도록)
      if (isAnyModalOpen) {
        console.warn('[SessionManager] Deferring logout - modal open, will retry after modal closes');
        requestDeferredLogout();
        return;
      }

      // 세션 갱신 실패 시 로그아웃 처리
      cancelDeferredLogout();
      await logout();
    }
  }, [activeModals, cancelDeferredLogout, checkAuth, isAnyModalOpen, isAuthenticated, logout, requestDeferredLogout]);

  useEffect(() => {
    if (!isAnyModalOpen && pendingLogoutRef.current) {
      cancelDeferredLogout();
      void logout();
    }
  }, [cancelDeferredLogout, isAnyModalOpen, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      // 인증되지 않은 경우 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      cancelDeferredLogout();
      return;
    }

    // 활동 감지 이벤트 리스너 등록
    const handleActivity = () => updateActivity();

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // 주기적 세션 갱신 설정
    intervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      // 마지막 활동으로부터 30분 이내인 경우에만 세션 갱신
      if (timeSinceLastActivity < 30 * 60 * 1000) {
        refreshSession();
      }
    }, SESSION_REFRESH_INTERVAL);

    // 정리 함수
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      cancelDeferredLogout();
    };
  }, [activeModals, cancelDeferredLogout, checkAuth, isAuthenticated, isAnyModalOpen, logout, refreshSession]);

  return {
    refreshSession,
    updateActivity,
  };
}
