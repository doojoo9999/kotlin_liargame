import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {authService} from '@/services'
import type {AuthState} from '../types/auth'

// Listen for session expiration events from API client
let storeInstance: any = null;

const handleSessionExpired = () => {
  if (storeInstance) {
    console.log('Session expired event received, clearing auth state');
    storeInstance.logout();
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth-session-expired', handleSessionExpired);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Store reference for event handler
      storeInstance = { set, get, logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
          localStorage.removeItem('auth-token');
        }
      }};
      
      return {
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
          // Clear all auth-related localStorage
          localStorage.removeItem('auth-token');
        }
      },

      checkAuth: async () => {
        const currentState = get();
        
        // Prevent multiple simultaneous auth checks
        if ((currentState as any).isRefreshing) {
          return;
        }
        
        // Mark as refreshing to prevent concurrent calls
        set({ ...currentState, isRefreshing: true } as any);
        
        try {
          const response = await authService.refreshSession();

          if (response.success) {
            set({
              isAuthenticated: true,
              userId: response.userId,
              nickname: response.nickname,
              isRefreshing: false,
            } as any);
            console.log('Auth state updated after refresh:', response.nickname);
          } else {
            console.log('Auth refresh unsuccessful:', response.message);
            set({
              isAuthenticated: false,
              userId: null,
              nickname: null,
              isRefreshing: false,
            } as any);
          }
        } catch (error) {
          // This shouldn't happen now since refreshSession doesn't throw
          console.error('Unexpected auth check error:', error);
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
            isRefreshing: false,
          } as any);
        }
      },
      };
    },
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
