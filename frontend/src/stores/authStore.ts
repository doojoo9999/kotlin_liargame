import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {authService} from '../services/authService'
import type {AuthState} from '../types/auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      isAuthenticated: false,
      userId: null,
      nickname: null,

      login: async (nickname: string) => {
        try {
          const response = await authService.login({ nickname });

          if (response.success) {
            set({
              isAuthenticated: true,
              userId: response.userId,
              nickname: response.nickname,
            });
            console.log('Auth state updated:', response.nickname);
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // 서버 오류와 관계없이 로컬 상태는 정리
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
        }
      },

      checkAuth: async () => {
        try {
          const response = await authService.refreshSession();

          if (response.success) {
            set({
              isAuthenticated: true,
              userId: response.userId,
              nickname: response.nickname,
            });
          } else {
            set({
              isAuthenticated: false,
              userId: null,
              nickname: null,
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // 민감한 정보는 제외하고 기본 상태만 저장
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        nickname: state.nickname,
      }),
    }
  )
)
