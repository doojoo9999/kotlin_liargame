import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false, // Hydration status state

      // Action to set hydration status
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },

      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // This function is called when the store is rehydrated from storage
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    }
  )
);
