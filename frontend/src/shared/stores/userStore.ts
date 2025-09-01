import {create} from 'zustand';

interface UserState {
  userId: number | null;
  nickname: string | null;
  isLoggedIn: boolean;
  setUser: (user: { userId: number; nickname: string }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  nickname: null,
  isLoggedIn: false,
  setUser: (user) => set({ userId: user.userId, nickname: user.nickname, isLoggedIn: true }),
  clearUser: () => set({ userId: null, nickname: null, isLoggedIn: false }),
}));
