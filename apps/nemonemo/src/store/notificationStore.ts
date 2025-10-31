import { nanoid } from 'nanoid';
import { create } from 'zustand';

type ToastPayload = {
  id: string;
  title: string;
  description?: string;
  duration?: number;
};

type NotificationStore = {
  toasts: ToastPayload[];
  pushToast: (toast: Omit<ToastPayload, 'id'>) => void;
  removeToast: (id: string) => void;
  clear: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  pushToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: nanoid(), ...toast }]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),
  clear: () => set({ toasts: [] })
}));
