import {apiClient} from '../../../shared/api/apiClient';
import {socketManager} from '../../../shared/socket/SocketManager';

export const logout = async (): Promise<void> => {
  try {
    console.log('[Logout] 로그아웃 프로세스 시작');

    // 1. WebSocket 연결 해제
    console.log('[Logout] WebSocket 연결 해제');
    socketManager.disconnect?.();

    // 2. 백엔드에 로그아웃 요청 (세션 무효화)
    console.log('[Logout] 백엔드 세션 무효화 요청');
    await apiClient.post('/api/v1/auth/logout');

    // 3. 로컬 스토리지 정리
    console.log('[Logout] 로컬 데이터 정리');
    localStorage.clear();
    sessionStorage.clear();

    console.log('[Logout] 로그아웃 완료');
  } catch (error) {
    console.error('[Logout] 로그아웃 중 오류 발생:', error);
    // 오류가 발생해도 로컬 정리는 수행
    localStorage.clear();
    sessionStorage.clear();
    throw error;
  }
};
