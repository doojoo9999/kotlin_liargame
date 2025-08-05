/**
 * 사용자 세션 상태를 확인하는 유틸리티 함수
 */

// 세션 정보 조회 및 웹소켓 인증 문제 확인
export const checkSessionStatus = async () => {
  console.log('[SESSION_DEBUG] Checking session status...');

  try {
    // 쿠키 확인
    console.log('[SESSION_DEBUG] Current cookies:', document.cookie);

    // 세션 API 호출
    const response = await fetch('/api/v1/auth/me', {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('[SESSION_DEBUG] Session API data:', userData);
      return {
        isAuthenticated: true,
        userData
      };
    } else {
      console.error('[SESSION_DEBUG] Session API error:', response.status);
      return {
        isAuthenticated: false,
        error: `Status ${response.status}`
      };
    }
  } catch (error) {
    console.error('[SESSION_DEBUG] Session check error:', error);
    return {
      isAuthenticated: false,
      error: error.message
    };
  }
};

// WebSocket 연결 전 세션 강제 갱신
export const refreshSessionBeforeConnect = async () => {
  console.log('[SESSION_DEBUG] Refreshing session before WebSocket connection...');

  try {
    const response = await fetch('/api/v1/auth/refresh-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('[SESSION_DEBUG] Session refreshed successfully');
      return true;
    } else {
      console.error('[SESSION_DEBUG] Failed to refresh session:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[SESSION_DEBUG] Session refresh error:', error);
    return false;
  }
};

// 모든 쿠키 확인
export const logAllCookies = () => {
  const cookies = document.cookie.split(';');
  console.log('[SESSION_DEBUG] All cookies:');

  if (cookies.length <= 1 && cookies[0] === '') {
    console.log('[SESSION_DEBUG] No cookies found');
    return;
  }

  cookies.forEach((cookie, index) => {
    const [name, value] = cookie.trim().split('=');
    console.log(`[SESSION_DEBUG] Cookie ${index + 1}: ${name} = ${value?.substring(0, 20)}${value?.length > 20 ? '...' : ''}`);
  });
};

export default {
  checkSessionStatus,
  refreshSessionBeforeConnect,
  logAllCookies
};
