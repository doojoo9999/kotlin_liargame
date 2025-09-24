import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {authService} from '@/services'
import {clearClientSessionState} from '@/utils/sessionCleanup'
import type {AuthState} from '../types/auth'

type LogoutOptions = { reason?: 'logout' | 'session-expired'; skipApi?: boolean };

let storeInstance: { logout: (options?: LogoutOptions) => Promise<void> } | null = null;

const handleSessionExpired = () => {
  if (storeInstance) {
    console.log('Session expired event received, clearing auth state');
    void storeInstance.logout({ reason: 'session-expired', skipApi: true });
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth-session-expired', handleSessionExpired);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const performLogout = async (options: LogoutOptions = {}) => {
        const { reason = 'logout', skipApi = false } = options;

        try {
          if (!skipApi) {
            await authService.logout();
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
            isRefreshing: false,
          });
          await clearClientSessionState({ reason, broadcastEvent: false });
        }
      };

      storeInstance = {
        logout: performLogout,
      };

      return {
        isAuthenticated: false,
        userId: null,
        nickname: null,
        isRefreshing: false,

        login: async (nickname: string) => {
          try {
            const response = await authService.login({ nickname });

            if (response.success) {
              set({
                isAuthenticated: true,
                userId: response.userId ?? null,
                nickname: response.nickname ?? null,
                isRefreshing: false,
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
              isRefreshing: false,
            });
            throw error;
          }
        },

        logout: async () => {
          await performLogout({ reason: 'logout' });
        },

        checkAuth: async () => {
          const currentState = get();

          if (currentState?.isRefreshing) {
            return;
          }

          set({ isRefreshing: true });

          try {
            const response = await authService.refreshSession();

            if (response.success) {
              set({
                isAuthenticated: true,
                userId: response.userId ?? null,
                nickname: response.nickname ?? null,
                isRefreshing: false,
              });
              console.log('Auth state updated after refresh:', response.nickname);
            } else {
              console.log('Auth refresh unsuccessful:', response.message);
              await performLogout({ reason: 'session-expired', skipApi: true });
            }
          } catch (error) {
            console.error('Unexpected auth check error:', error);
            await performLogout({ reason: 'session-expired', skipApi: true });
          }
        },
      };
    },
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        nickname: state.nickname,
      }),
    },
  ),
);
