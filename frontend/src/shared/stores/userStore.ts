import {create} from 'zustand';

interface UserState {
  nickname: string | null;
  isLoggedIn: boolean;
  setUser: (nickname: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  nickname: null,
  isLoggedIn: false,
  setUser: (nickname) => set({ nickname, isLoggedIn: true }),
  clearUser: () => set({ nickname: null, isLoggedIn: false }),
}));
