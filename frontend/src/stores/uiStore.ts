import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import {withPersistence} from './middleware/persistence';
import {withLogger} from './middleware/logger';
import type {ModalState, NotificationItem, UIStoreActions, UIStoreState} from '@/types/store';

const initialState: UIStoreState = {
  currentScreen: 'HOME',
  previousScreen: undefined,
  modalStack: [],
  isLoading: false,
  loadingMessage: undefined,
  errors: {},
  notifications: [],
  sidebarOpen: false,
  chatOpen: false,
  settingsOpen: false,
  formData: {},
  formErrors: {},
  unreadChat: 0,
  lastChatMessage: undefined,
};

const genId = () => (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));

export const useUIStore = create<UIStoreState & UIStoreActions>()(
  devtools(
    withLogger(
      withPersistence(
        'ui-store',
        (set, get) => ({
          ...initialState,
          navigate: (screen) => set(state => ({ previousScreen: state.currentScreen, currentScreen: screen })),
          showModal: (modal) => {
            const id = genId();
            const newModal: ModalState = { id, ...modal };
            set(state => ({ modalStack: [...state.modalStack, newModal] }));
            return id;
          },
          hideModal: (id) => set(state => ({
            modalStack: id ? state.modalStack.filter(m => m.id !== id) : state.modalStack.slice(0, -1),
          })),
          setLoading: (isLoading, message) => set({ isLoading, loadingMessage: message }),
          addError: (key, message) => set(state => ({ errors: { ...state.errors, [key]: message } })),
          clearErrors: () => set({ errors: {} }),
          showNotification: (n) => {
            const id = genId();
            const notif: NotificationItem = { id, createdAt: Date.now(), autoClose: 5000, ...n };
            set(state => ({ notifications: [...state.notifications, notif] }));
            return id;
          },
          removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),
          toggleSidebar: (open) => set(state => ({ sidebarOpen: open ?? !state.sidebarOpen })),
            toggleChat: (open) => set(state => ({ chatOpen: open ?? !state.chatOpen, unreadChat: open ? 0 : state.unreadChat })),
          toggleSettings: (open) => set(state => ({ settingsOpen: open ?? !state.settingsOpen })),
          setFormData: (data) => set({ formData: data }),
          updateFormField: (field, value) => set(state => ({ formData: { ...state.formData, [field]: value } })),
          setFormErrors: (errs) => set({ formErrors: errs }),
          clearForm: () => set({ formData: {}, formErrors: {} }),
          registerChatMessage: (msg) => set(state => ({ lastChatMessage: msg, unreadChat: state.chatOpen ? state.unreadChat : state.unreadChat + 1 })),
          clearUnreadChat: () => set({ unreadChat: 0 }),
        }),
        {
          partialize: (s) => ({ currentScreen: s.currentScreen, sidebarOpen: s.sidebarOpen }),
        }
      )
    )
  )
);

export type UIStore = ReturnType<typeof useUIStore.getState>;

