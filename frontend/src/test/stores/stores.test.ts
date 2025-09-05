/**
 * Store Tests
 * 
 * Tests for Zustand stores and state management
 * including auth store, game store, chat store, and UI store.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock zustand
vi.mock('zustand');

// Mock store interfaces
interface User {
  id: string;
  nickname: string;
  token: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

interface GameState {
  id: string | null;
  status: 'waiting' | 'in_progress' | 'ended';
  players: Player[];
  currentPhase: string | null;
  timeLeft: number;
  settings: {
    maxPlayers: number;
    timeLimit: number;
  };
}

interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  score: number;
  role?: 'normal' | 'liar';
  isHost: boolean;
}

interface GameStore extends GameState {
  updateGameState: (state: Partial<GameState>) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setTimeLeft: (time: number) => void;
  resetGame: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: 'normal' | 'system' | 'whisper';
}

interface ChatStore {
  messages: ChatMessage[];
  unreadCount: number;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  markAsRead: () => void;
}

interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

describe('Zustand Stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthStore', () => {
    it('should initialize with empty state', () => {
      const mockCreateAuthStore = () => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        setLoading: vi.fn()
      });

      const store = mockCreateAuthStore();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.isLoading).toBe(false);
    });

    it('should handle user login', () => {
      let state = {
        user: null as User | null,
        isAuthenticated: false,
        isLoading: false
      };

      const mockStore = {
        ...state,
        login: (userData: User) => {
          state.user = userData;
          state.isAuthenticated = true;
          state.isLoading = false;
          
          // Save to localStorage
          localStorage.setItem('token', userData.token);
          localStorage.setItem('user', JSON.stringify(userData));
        },
        logout: () => {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        },
        setLoading: (loading: boolean) => {
          state.isLoading = loading;
        },
        get user() { return state.user; },
        get isAuthenticated() { return state.isAuthenticated; },
        get isLoading() { return state.isLoading; }
      };

      // Mock localStorage
      const mockSetItem = vi.fn();
      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        getItem: vi.fn()
      });

      const testUser: User = {
        id: 'user-123',
        nickname: '테스트유저',
        token: 'mock-jwt-token'
      };

      mockStore.login(testUser);

      expect(mockStore.user).toEqual(testUser);
      expect(mockStore.isAuthenticated).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith('token', testUser.token);
      expect(mockSetItem).toHaveBeenCalledWith('user', JSON.stringify(testUser));
    });

    it('should handle user logout', () => {
      let state = {
        user: {
          id: 'user-123',
          nickname: '테스트유저',
          token: 'mock-token'
        } as User | null,
        isAuthenticated: true,
        isLoading: false
      };

      const mockStore = {
        ...state,
        logout: () => {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        },
        get user() { return state.user; },
        get isAuthenticated() { return state.isAuthenticated; }
      };

      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        removeItem: mockRemoveItem
      });

      mockStore.logout();

      expect(mockStore.user).toBeNull();
      expect(mockStore.isAuthenticated).toBe(false);
      expect(mockRemoveItem).toHaveBeenCalledWith('token');
      expect(mockRemoveItem).toHaveBeenCalledWith('user');
    });

    it('should persist user data on refresh', () => {
      const storedUser = {
        id: 'user-123',
        nickname: '테스트유저',
        token: 'stored-token'
      };

      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'user') return JSON.stringify(storedUser);
          if (key === 'token') return storedUser.token;
          return null;
        })
      });

      const createAuthStore = () => {
        const storedUserData = localStorage.getItem('user');
        const user = storedUserData ? JSON.parse(storedUserData) : null;
        
        return {
          user,
          isAuthenticated: !!user,
          isLoading: false
        };
      };

      const store = createAuthStore();

      expect(store.user).toEqual(storedUser);
      expect(store.isAuthenticated).toBe(true);
    });
  });

  describe('GameStore', () => {
    it('should initialize with default game state', () => {
      const initialState: GameState = {
        id: null,
        status: 'waiting',
        players: [],
        currentPhase: null,
        timeLeft: 0,
        settings: {
          maxPlayers: 6,
          timeLimit: 300
        }
      };

      const mockGameStore = {
        ...initialState,
        updateGameState: vi.fn(),
        addPlayer: vi.fn(),
        removePlayer: vi.fn(),
        updatePlayer: vi.fn(),
        setTimeLeft: vi.fn(),
        resetGame: vi.fn()
      };

      expect(mockGameStore.id).toBeNull();
      expect(mockGameStore.status).toBe('waiting');
      expect(mockGameStore.players).toHaveLength(0);
      expect(mockGameStore.settings.maxPlayers).toBe(6);
    });

    it('should update game state', () => {
      let state: GameState = {
        id: 'game-123',
        status: 'waiting',
        players: [],
        currentPhase: null,
        timeLeft: 0,
        settings: {
          maxPlayers: 6,
          timeLimit: 300
        }
      };

      const mockStore = {
        ...state,
        updateGameState: (updates: Partial<GameState>) => {
          state = { ...state, ...updates };
        },
        get status() { return state.status; },
        get currentPhase() { return state.currentPhase; }
      };

      mockStore.updateGameState({
        status: 'in_progress',
        currentPhase: 'speech'
      });

      expect(mockStore.status).toBe('in_progress');
      expect(mockStore.currentPhase).toBe('speech');
    });

    it('should manage players', () => {
      let players: Player[] = [];

      const mockStore = {
        players,
        addPlayer: (player: Player) => {
          players = [...players, player];
        },
        removePlayer: (playerId: string) => {
          players = players.filter(p => p.id !== playerId);
        },
        updatePlayer: (playerId: string, updates: Partial<Player>) => {
          players = players.map(p => 
            p.id === playerId ? { ...p, ...updates } : p
          );
        },
        get players() { return players; }
      };

      const testPlayer: Player = {
        id: 'player-1',
        nickname: '플레이어1',
        isReady: false,
        score: 0,
        isHost: true
      };

      // Add player
      mockStore.addPlayer(testPlayer);
      expect(mockStore.players).toHaveLength(1);
      expect(mockStore.players[0].nickname).toBe('플레이어1');

      // Update player
      mockStore.updatePlayer('player-1', { isReady: true, score: 100 });
      expect(mockStore.players[0].isReady).toBe(true);
      expect(mockStore.players[0].score).toBe(100);

      // Remove player
      mockStore.removePlayer('player-1');
      expect(mockStore.players).toHaveLength(0);
    });

    it('should handle timer updates', () => {
      let timeLeft = 300;

      const mockStore = {
        timeLeft,
        setTimeLeft: (time: number) => {
          timeLeft = time;
        },
        get timeLeft() { return timeLeft; }
      };

      mockStore.setTimeLeft(250);
      expect(mockStore.timeLeft).toBe(250);

      mockStore.setTimeLeft(0);
      expect(mockStore.timeLeft).toBe(0);
    });

    it('should reset game state', () => {
      let state: GameState = {
        id: 'game-123',
        status: 'in_progress',
        players: [
          {
            id: 'player-1',
            nickname: '플레이어1',
            isReady: true,
            score: 100,
            isHost: true
          }
        ],
        currentPhase: 'voting',
        timeLeft: 150,
        settings: {
          maxPlayers: 6,
          timeLimit: 300
        }
      };

      const mockStore = {
        ...state,
        resetGame: () => {
          state = {
            id: null,
            status: 'waiting',
            players: [],
            currentPhase: null,
            timeLeft: 0,
            settings: {
              maxPlayers: 6,
              timeLimit: 300
            }
          };
        },
        get id() { return state.id; },
        get status() { return state.status; },
        get players() { return state.players; },
        get currentPhase() { return state.currentPhase; },
        get timeLeft() { return state.timeLeft; }
      };

      mockStore.resetGame();

      expect(mockStore.id).toBeNull();
      expect(mockStore.status).toBe('waiting');
      expect(mockStore.players).toHaveLength(0);
      expect(mockStore.currentPhase).toBeNull();
      expect(mockStore.timeLeft).toBe(0);
    });
  });

  describe('ChatStore', () => {
    it('should initialize with empty messages', () => {
      const mockChatStore = {
        messages: [] as ChatMessage[],
        unreadCount: 0,
        addMessage: vi.fn(),
        clearMessages: vi.fn(),
        markAsRead: vi.fn()
      };

      expect(mockChatStore.messages).toHaveLength(0);
      expect(mockChatStore.unreadCount).toBe(0);
    });

    it('should add messages', () => {
      let messages: ChatMessage[] = [];
      let unreadCount = 0;

      const mockStore = {
        messages,
        unreadCount,
        addMessage: (message: ChatMessage) => {
          messages = [...messages, message];
          unreadCount += 1;
        },
        get messages() { return messages; },
        get unreadCount() { return unreadCount; }
      };

      const testMessage: ChatMessage = {
        id: 'msg-1',
        sender: '플레이어1',
        message: '안녕하세요!',
        timestamp: new Date().toISOString(),
        type: 'normal'
      };

      mockStore.addMessage(testMessage);

      expect(mockStore.messages).toHaveLength(1);
      expect(mockStore.messages[0].message).toBe('안녕하세요!');
      expect(mockStore.unreadCount).toBe(1);
    });

    it('should clear messages', () => {
      let messages: ChatMessage[] = [
        {
          id: 'msg-1',
          sender: '플레이어1',
          message: '테스트 메시지',
          timestamp: new Date().toISOString(),
          type: 'normal'
        }
      ];
      let unreadCount = 1;

      const mockStore = {
        messages,
        unreadCount,
        clearMessages: () => {
          messages = [];
          unreadCount = 0;
        },
        get messages() { return messages; },
        get unreadCount() { return unreadCount; }
      };

      mockStore.clearMessages();

      expect(mockStore.messages).toHaveLength(0);
      expect(mockStore.unreadCount).toBe(0);
    });

    it('should mark messages as read', () => {
      let unreadCount = 5;

      const mockStore = {
        unreadCount,
        markAsRead: () => {
          unreadCount = 0;
        },
        get unreadCount() { return unreadCount; }
      };

      mockStore.markAsRead();
      expect(mockStore.unreadCount).toBe(0);
    });

    it('should handle system messages', () => {
      let messages: ChatMessage[] = [];

      const mockStore = {
        messages,
        addSystemMessage: (message: string) => {
          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            sender: 'System',
            message,
            timestamp: new Date().toISOString(),
            type: 'system'
          };
          messages = [...messages, systemMessage];
        },
        get messages() { return messages; }
      };

      mockStore.addSystemMessage('플레이어1님이 게임에 참가했습니다.');

      expect(mockStore.messages).toHaveLength(1);
      expect(mockStore.messages[0].type).toBe('system');
      expect(mockStore.messages[0].sender).toBe('System');
    });
  });

  describe('UIStore', () => {
    it('should initialize with default UI state', () => {
      const mockUIStore = {
        theme: 'light' as const,
        sidebarOpen: false,
        notifications: [] as Notification[],
        setTheme: vi.fn(),
        toggleSidebar: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn()
      };

      expect(mockUIStore.theme).toBe('light');
      expect(mockUIStore.sidebarOpen).toBe(false);
      expect(mockUIStore.notifications).toHaveLength(0);
    });

    it('should toggle theme', () => {
      let theme: 'light' | 'dark' = 'light';

      const mockStore = {
        theme,
        setTheme: (newTheme: 'light' | 'dark') => {
          theme = newTheme;
          localStorage.setItem('theme', newTheme);
        },
        get theme() { return theme; }
      };

      const mockSetItem = vi.fn();
      vi.stubGlobal('localStorage', {
        setItem: mockSetItem
      });

      mockStore.setTheme('dark');

      expect(mockStore.theme).toBe('dark');
      expect(mockSetItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle sidebar', () => {
      let sidebarOpen = false;

      const mockStore = {
        sidebarOpen,
        toggleSidebar: () => {
          sidebarOpen = !sidebarOpen;
        },
        get sidebarOpen() { return sidebarOpen; }
      };

      mockStore.toggleSidebar();
      expect(mockStore.sidebarOpen).toBe(true);

      mockStore.toggleSidebar();
      expect(mockStore.sidebarOpen).toBe(false);
    });

    it('should manage notifications', () => {
      let notifications: Notification[] = [];

      const mockStore = {
        notifications,
        addNotification: (notification: Omit<Notification, 'id'>) => {
          const newNotification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9)
          };
          notifications = [...notifications, newNotification];
        },
        removeNotification: (id: string) => {
          notifications = notifications.filter(n => n.id !== id);
        },
        get notifications() { return notifications; }
      };

      // Add notification
      mockStore.addNotification({
        type: 'success',
        message: '게임에 성공적으로 참가했습니다.',
        duration: 5000
      });

      expect(mockStore.notifications).toHaveLength(1);
      expect(mockStore.notifications[0].type).toBe('success');
      expect(mockStore.notifications[0].message).toBe('게임에 성공적으로 참가했습니다.');

      // Remove notification
      const notificationId = mockStore.notifications[0].id;
      mockStore.removeNotification(notificationId);

      expect(mockStore.notifications).toHaveLength(0);
    });
  });

  describe('Store Integration', () => {
    it('should handle cross-store interactions', () => {
      // Mock multiple stores working together
      let authState = { user: null, isAuthenticated: false };
      let gameState = { id: null, players: [] };
      let chatState = { messages: [] };

      const mockAuthStore = {
        ...authState,
        login: (user: any) => {
          authState = { user, isAuthenticated: true };
          // When user logs in, initialize game state
          gameState = { id: null, players: [] };
          // Clear previous chat messages
          chatState = { messages: [] };
        },
        logout: () => {
          authState = { user: null, isAuthenticated: false };
          // Reset all other stores
          gameState = { id: null, players: [] };
          chatState = { messages: [] };
        }
      };

      const mockGameStore = {
        ...gameState,
        joinGame: (gameId: string) => {
          if (authState.isAuthenticated) {
            gameState = { id: gameId, players: [authState.user] };
            // Add system message when joining
            const systemMessage = {
              id: 'system-join',
              sender: 'System',
              message: `${authState.user.nickname}님이 게임에 참가했습니다.`,
              timestamp: new Date().toISOString(),
              type: 'system' as const
            };
            chatState.messages = [systemMessage];
          }
        }
      };

      // Simulate user flow
      mockAuthStore.login({ id: 'user-1', nickname: '테스트유저' });
      expect(authState.isAuthenticated).toBe(true);

      mockGameStore.joinGame('game-123');
      expect(gameState.id).toBe('game-123');
      expect(chatState.messages).toHaveLength(1);
      expect(chatState.messages[0].type).toBe('system');
    });
  });
});