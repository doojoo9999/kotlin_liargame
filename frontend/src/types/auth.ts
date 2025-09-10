// 로그인 요청 (닉네임만 사용)
export interface LoginRequest {
  nickname: string;
}

// 로그인 응답
export interface LoginResponse {
  success: boolean;
  userId: number;
  nickname: string;
}

// 세션 갱신 응답
export interface SessionRefreshResponse {
  success: boolean;
  userId: number;
  nickname: string;
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
