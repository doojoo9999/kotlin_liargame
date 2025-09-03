import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {LoginRequest, LoginResponse, User} from '@/shared/types/auth.types';
import {API_ENDPOINTS} from '@/shared/api/endpoints';

interface AuthStore {
  // 상태
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 액션
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshTokenAction: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 로그인
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data: LoginResponse = await response.json();

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem('auth_token', data.token);

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed'
          });
          throw error;
        }
      },

      // 로그아웃
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // 토큰 갱신 (이름 변경하여 충돌 방지)
      refreshTokenAction: async () => {
        const { refreshToken: currentRefreshToken } = get();

        if (!currentRefreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data: LoginResponse = await response.json();

          set({
            token: data.token,
            refreshToken: data.refreshToken,
            user: data.user,
          });

          localStorage.setItem('auth_token', data.token);

        } catch (error) {
          get().logout();
          throw error;
        }
      },

      // 사용자 정보 업데이트
      updateUser: (userUpdate: Partial<User>) => {
        set(state => ({
          user: state.user ? { ...state.user, ...userUpdate } : null
        }));
      },

      // 로딩 상태 설정
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 에러 초기화
      clearError: () => {
        set({ error: null });
      },

      // 초기화
      initialize: () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          set({ token, isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
