// Central shared store-related types
import type {WebSocketChatMessage as ChatMessage} from '@/types';

export type Screen = 'LOBBY' | 'GAME' | 'RESULTS' | 'LOGIN' | 'HOME' | 'SETTINGS';
export type ModalType = 'NONE' | 'CONFIRM' | 'ALERT' | 'GAME_SETTINGS' | 'PLAYER_LIST' | 'CHAT';

export interface ModalState {
  id: string;
  type: ModalType;
  props?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  description?: string;
  createdAt: number;
  autoClose?: number; // ms
}

export interface OutgoingMessage {
  id: string;
  destination: string;
  body: any;
  timestamp: number;
  attempts: number;
  optimisticUpdateId?: string;
}

export interface PendingMessage extends OutgoingMessage {
  status: 'queued' | 'sent' | 'ack' | 'failed';
  lastAttempt: number | null;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export interface LatencySample {
  id: string;
  sentAt: number;
  receivedAt: number;
  rtt: number;
}

export interface OptimisticUpdate<StateShape = any> {
  id: string;
  action: string;
  optimisticState: Partial<StateShape>;
  originalState: Partial<StateShape>;
  timestamp: number;
  confirmed: boolean;
  rolledBack: boolean;
}

export interface SyncIssue {
  id: string;
  type: 'CONFLICT' | 'OUT_OF_ORDER' | 'VALIDATION_ERROR';
  description: string;
  timestamp: number;
  data?: any;
}

export interface UIStoreState {
  currentScreen: Screen;
  previousScreen?: Screen;
  modalStack: ModalState[];
  isLoading: boolean;
  loadingMessage?: string;
  errors: Record<string, string>;
  notifications: NotificationItem[];
  sidebarOpen: boolean;
  chatOpen: boolean;
  settingsOpen: boolean;
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  unreadChat: number;
  lastChatMessage?: ChatMessage;
}

export interface UIStoreActions {
  navigate: (screen: Screen) => void;
  showModal: (modal: Omit<ModalState, 'id'>) => string;
  hideModal: (id?: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  addError: (key: string, message: string) => void;
  clearErrors: () => void;
  showNotification: (n: Omit<NotificationItem, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  toggleSidebar: (open?: boolean) => void;
  toggleChat: (open?: boolean) => void;
  toggleSettings: (open?: boolean) => void;
  setFormData: (data: Record<string, any>) => void;
  updateFormField: (field: string, value: any) => void;
  setFormErrors: (errs: Record<string, string>) => void;
  clearForm: () => void;
  registerChatMessage: (msg: ChatMessage) => void;
  clearUnreadChat: () => void;
}

export interface ConnectionStoreState {
  status: ConnectionStatus;
  error?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastConnectedAt?: number;
  lastDisconnectedAt?: number;
  lastPingAt?: number;
  lastPongAt?: number;
  avgLatency?: number;
  latencySamples: LatencySample[];
  messageQueue: OutgoingMessage[];
  pendingMessages: Record<string, PendingMessage>;
  processingQueue: boolean;
  optimisticUpdates: Record<string, OptimisticUpdate>;
  syncIssues: SyncIssue[];
}

export interface ConnectionStoreActions {
  connect: (gameId?: string, userId?: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (destination: string, body: any, opts?: { optimisticState?: any }) => void;
  queueMessage: (msg: Omit<OutgoingMessage, 'id' | 'timestamp' | 'attempts'> & { id?: string }) => string;
  processQueue: () => Promise<void>;
  setStatus: (status: ConnectionStatus, error?: string) => void;
  recordLatency: (sample: LatencySample) => void;
  clearLatency: () => void;
  addOptimisticUpdate: (update: Omit<OptimisticUpdate, 'id' | 'timestamp' | 'confirmed' | 'rolledBack'>) => string;
  confirmOptimistic: (id: string, serverState?: any) => void;
  rollbackOptimistic: (id: string) => void;
  addSyncIssue: (issue: Omit<SyncIssue, 'id' | 'timestamp'>) => void;
  clearSyncIssues: () => void;
  pruneQueue: () => void;
}

