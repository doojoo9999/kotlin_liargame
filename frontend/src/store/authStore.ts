import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import {authService} from '../services/authService';
import type {LoginRequest, LoginResponse} from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  nickname: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  nickname: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        login: async (credentials: LoginRequest) => {
          set({ isLoading: true, error: null });
          try {
            const response: LoginResponse = await authService.login(credentials);

            if (response.success) {
              set({
                isAuthenticated: true,
                userId: response.userId,
                nickname: response.nickname,
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error('로그인에 실패했습니다');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다';
            set({
              isAuthenticated: false,
              userId: null,
              nickname: null,
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true, error: null });
          try {
            await authService.logout();
            set({
              ...initialState,
              isLoading: false,
            });
          } catch (error) {
            console.error('Logout error:', error);
            // 로그아웃 실패해도 로컬 상태는 정리
            set({
              ...initialState,
              isLoading: false,
            });
          }
        },

        checkAuth: async () => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.refreshSession();

            if (response.success) {
              set({
                isAuthenticated: true,
                userId: response.userId,
                nickname: response.nickname,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                ...initialState,
                isLoading: false,
              });
            }
          } catch (error) {
            set({
              ...initialState,
              isLoading: false,
            });
          }
        },

        setLoading: (isLoading: boolean) => set({ isLoading }),
        setError: (error: string | null) => set({ error }),
        clearAuth: () => set({ ...initialState }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          userId: state.userId,
          nickname: state.nickname,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);
