import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  nickname: string | null
  isAuthenticated: boolean
  login: (nickname: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      nickname: null,
      isAuthenticated: false,
      login: (nickname) => set({ nickname, isAuthenticated: true }),
      logout: () => set({ nickname: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
