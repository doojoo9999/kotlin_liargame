// 로그인 요청 (닉네임만 사용)
export interface LoginRequest {
  nickname: string;
}

// 로그인 응답 (백엔드와 매칭)
export interface LoginResponse {
  success: boolean;
  userId?: number;  // 백엔드는 Long 타입이지만 optional 가능
  nickname?: string;
  message?: string;
}

// 세션 갱신 응답 (백엔드와 매칭)
export interface SessionRefreshResponse {
  success: boolean;
  userId?: number;
  nickname?: string;
  message?: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  nickname: string | null;
  login: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
