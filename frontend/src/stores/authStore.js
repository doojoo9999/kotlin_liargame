import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      initializeAuth: () => {
        const storedState = JSON.parse(localStorage.getItem('auth-storage'));
        if (storedState?.state?.user) {
          set({ user: storedState.state.user, isAuthenticated: true });
        }
      },
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
