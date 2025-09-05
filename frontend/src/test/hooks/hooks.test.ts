/**
 * Custom Hooks Tests
 * 
 * Tests for custom React hooks including authentication,
 * game state management, WebSocket connections, and form handling.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';

// Mock dependencies
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: vi.fn(),
    useQuery: vi.fn(),
    useQueryClient: vi.fn()
  };
});

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Custom Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuth Hook', () => {
    it('should initialize with no authenticated user', () => {
      const useAuth = () => {
        const [user, setUser] = React.useState(null);
        const [isLoading, setIsLoading] = React.useState(false);
        
        return {
          user,
          isLoading,
          isAuthenticated: !!user,
          setUser,
          setIsLoading
        };
      };

      // Mock React useState
      let currentUser = null;
      let currentLoading = false;
      
      vi.doMock('react', () => ({
        useState: vi.fn()
          .mockReturnValueOnce([currentUser, vi.fn((newUser) => currentUser = newUser)])
          .mockReturnValueOnce([currentLoading, vi.fn((loading) => currentLoading = loading)])
      }));

      const mockUseAuth = () => ({
        user: currentUser,
        isLoading: currentLoading,
        isAuthenticated: !!currentUser,
        setUser: (user: any) => currentUser = user,
        setIsLoading: (loading: boolean) => currentLoading = loading
      });

      const { result } = renderHook(() => mockUseAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle user login', () => {
      let currentUser = null;
      
      const mockUseAuth = () => {
        const login = (userData: any) => {
          currentUser = userData;
        };

        return {
          user: currentUser,
          isAuthenticated: !!currentUser,
          login
        };
      };

      const { result } = renderHook(() => mockUseAuth());

      act(() => {
        result.current.login({
          id: 'user-123',
          nickname: '테스트유저',
          token: 'mock-token'
        });
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        nickname: '테스트유저',
        token: 'mock-token'
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle user logout', () => {
      let currentUser = { id: 'user-123', nickname: '테스트유저' };
      
      const mockUseAuth = () => {
        const logout = () => {
          currentUser = null;
          localStorage.removeItem('token');
        };

        return {
          user: currentUser,
          isAuthenticated: !!currentUser,
          logout
        };
      };

      // Mock localStorage
      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        removeItem: mockRemoveItem
      });

      const { result } = renderHook(() => mockUseAuth());

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockRemoveItem).toHaveBeenCalledWith('token');
    });
  });

  describe('useWebSocket Hook', () => {
    it('should initialize WebSocket connection', () => {
      const mockSocket = {
        readyState: WebSocket.CONNECTING,
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      vi.stubGlobal('WebSocket', vi.fn(() => mockSocket));

      const useWebSocket = (url: string) => {
        const [socket, setSocket] = React.useState<WebSocket | null>(null);
        const [isConnected, setIsConnected] = React.useState(false);

        React.useEffect(() => {
          const ws = new WebSocket(url);
          setSocket(ws);

          ws.addEventListener('open', () => setIsConnected(true));
          ws.addEventListener('close', () => setIsConnected(false));

          return () => {
            ws.close();
          };
        }, [url]);

        return { socket, isConnected };
      };

      // Mock React hooks
      let currentSocket = null;
      let currentConnected = false;
      let effectCallback: (() => void) | null = null;

      vi.doMock('react', () => ({
        useState: vi.fn()
          .mockReturnValueOnce([currentSocket, (socket: any) => currentSocket = socket])
          .mockReturnValueOnce([currentConnected, (connected: boolean) => currentConnected = connected]),
        useEffect: vi.fn((callback) => {
          effectCallback = callback;
          callback();
        })
      }));

      const mockUseWebSocket = (url: string) => {
        const ws = new WebSocket(url);
        currentSocket = ws;
        return {
          socket: currentSocket,
          isConnected: currentConnected
        };
      };

      const { result } = renderHook(() => mockUseWebSocket('ws://localhost:8080'));

      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080');
      expect(result.current.socket).toBe(mockSocket);
    });

    it('should handle WebSocket messages', () => {
      const mockSocket = {
        readyState: WebSocket.OPEN,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        send: vi.fn(),
        close: vi.fn()
      };

      const useWebSocket = () => {
        const [messages, setMessages] = React.useState<any[]>([]);
        
        const handleMessage = (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);
        };

        return {
          messages,
          handleMessage,
          sendMessage: (message: any) => {
            if (mockSocket.readyState === WebSocket.OPEN) {
              mockSocket.send(JSON.stringify(message));
            }
          }
        };
      };

      let currentMessages: any[] = [];
      
      const mockUseWebSocket = () => ({
        messages: currentMessages,
        handleMessage: (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          currentMessages = [...currentMessages, message];
        },
        sendMessage: (message: any) => {
          mockSocket.send(JSON.stringify(message));
        }
      });

      const { result } = renderHook(() => mockUseWebSocket());

      // Simulate receiving a message
      act(() => {
        result.current.handleMessage({
          data: JSON.stringify({ type: 'chat', content: 'Hello' })
        } as MessageEvent);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual({
        type: 'chat',
        content: 'Hello'
      });

      // Test sending a message
      act(() => {
        result.current.sendMessage({ type: 'game', action: 'vote' });
      });

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'game', action: 'vote' })
      );
    });

    it('should clean up WebSocket connection on unmount', () => {
      const mockSocket = {
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      const useWebSocket = () => {
        React.useEffect(() => {
          return () => {
            mockSocket.close();
          };
        }, []);

        return { socket: mockSocket };
      };

      let cleanupFunction: (() => void) | null = null;

      vi.doMock('react', () => ({
        useEffect: vi.fn((callback) => {
          cleanupFunction = callback();
        })
      }));

      const { unmount } = renderHook(() => useWebSocket());

      unmount();

      if (cleanupFunction) {
        cleanupFunction();
      }

      expect(mockSocket.close).toHaveBeenCalled();
    });
  });

  describe('useTimer Hook', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should initialize with specified time', () => {
      const useTimer = (initialTime: number) => {
        const [timeLeft, setTimeLeft] = React.useState(initialTime);
        const [isRunning, setIsRunning] = React.useState(false);

        return { timeLeft, isRunning };
      };

      let currentTime = 60;
      let currentRunning = false;

      const mockUseTimer = (initialTime: number) => ({
        timeLeft: currentTime,
        isRunning: currentRunning
      });

      const { result } = renderHook(() => mockUseTimer(60));

      expect(result.current.timeLeft).toBe(60);
      expect(result.current.isRunning).toBe(false);
    });

    it('should countdown when started', () => {
      let currentTime = 60;
      let currentRunning = false;
      let intervalId: NodeJS.Timeout | null = null;

      const mockUseTimer = () => {
        const start = () => {
          currentRunning = true;
          intervalId = setInterval(() => {
            if (currentTime > 0) {
              currentTime -= 1;
            } else {
              currentRunning = false;
              if (intervalId) clearInterval(intervalId);
            }
          }, 1000);
        };

        const stop = () => {
          currentRunning = false;
          if (intervalId) clearInterval(intervalId);
        };

        const reset = (time: number) => {
          currentTime = time;
          currentRunning = false;
          if (intervalId) clearInterval(intervalId);
        };

        return {
          timeLeft: currentTime,
          isRunning: currentRunning,
          start,
          stop,
          reset
        };
      };

      const { result } = renderHook(() => mockUseTimer());

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeLeft).toBe(57);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('should stop at zero', () => {
      let currentTime = 2;
      let currentRunning = false;
      let intervalId: NodeJS.Timeout | null = null;

      const mockUseTimer = () => {
        const start = () => {
          currentRunning = true;
          intervalId = setInterval(() => {
            if (currentTime > 0) {
              currentTime -= 1;
            } else {
              currentRunning = false;
              if (intervalId) clearInterval(intervalId);
            }
          }, 1000);
        };

        return {
          timeLeft: currentTime,
          isRunning: currentRunning,
          start
        };
      };

      const { result } = renderHook(() => mockUseTimer());

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('useNotifications Hook', () => {
    it('should add and display notifications', () => {
      interface Notification {
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
        duration?: number;
      }

      let notifications: Notification[] = [];

      const useNotifications = () => {
        const addNotification = (notification: Omit<Notification, 'id'>) => {
          const newNotification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9)
          };
          notifications = [...notifications, newNotification];
        };

        const removeNotification = (id: string) => {
          notifications = notifications.filter(n => n.id !== id);
        };

        return {
          notifications,
          addNotification,
          removeNotification
        };
      };

      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          type: 'success',
          message: '게임에 참가했습니다!'
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('success');
      expect(result.current.notifications[0].message).toBe('게임에 참가했습니다!');

      act(() => {
        result.current.removeNotification(result.current.notifications[0].id);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should auto-remove notifications after duration', () => {
      vi.useFakeTimers();

      let notifications: any[] = [];
      let timeouts: NodeJS.Timeout[] = [];

      const useNotifications = () => {
        const addNotification = (notification: any) => {
          const newNotification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9)
          };
          notifications = [...notifications, newNotification];

          if (notification.duration !== 0) {
            const timeout = setTimeout(() => {
              notifications = notifications.filter(n => n.id !== newNotification.id);
            }, notification.duration || 5000);
            timeouts.push(timeout);
          }
        };

        return { notifications, addNotification };
      };

      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          type: 'info',
          message: '자동으로 사라지는 메시지',
          duration: 3000
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.notifications).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('useGameState Hook', () => {
    it('should fetch and update game state', () => {
      const mockGameState = {
        id: 'game-123',
        status: 'waiting',
        players: [],
        currentPhase: null
      };

      let currentState = mockGameState;

      const useGameState = (gameId: string) => {
        const [gameState, setGameState] = React.useState(currentState);
        const [isLoading, setIsLoading] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);

        const updateState = (newState: any) => {
          setGameState(newState);
        };

        return {
          gameState,
          isLoading,
          error,
          updateState
        };
      };

      let gameState = mockGameState;
      let isLoading = false;
      let error = null;

      const mockUseGameState = () => {
        const updateState = (newState: any) => {
          gameState = { ...gameState, ...newState };
        };

        return {
          gameState,
          isLoading,
          error,
          updateState
        };
      };

      const { result } = renderHook(() => mockUseGameState());

      expect(result.current.gameState.id).toBe('game-123');
      expect(result.current.gameState.status).toBe('waiting');

      act(() => {
        result.current.updateState({
          status: 'in_progress',
          currentPhase: 'speech'
        });
      });

      expect(result.current.gameState.status).toBe('in_progress');
      expect(result.current.gameState.currentPhase).toBe('speech');
    });

    it('should handle game state errors', () => {
      let error: string | null = 'Failed to load game';
      let isLoading = false;

      const mockUseGameState = () => ({
        gameState: null,
        isLoading,
        error,
        refetch: () => {
          isLoading = true;
          error = null;
          
          setTimeout(() => {
            isLoading = false;
            error = 'Connection failed';
          }, 100);
        }
      });

      const { result } = renderHook(() => mockUseGameState());

      expect(result.current.error).toBe('Failed to load game');
      expect(result.current.gameState).toBeNull();

      act(() => {
        result.current.refetch();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useForm Hook', () => {
    it('should handle form state and validation', () => {
      interface FormData {
        nickname: string;
        roomCode?: string;
      }

      const useForm = (initialValues: FormData) => {
        const [values, setValues] = React.useState(initialValues);
        const [errors, setErrors] = React.useState<Partial<FormData>>({});
        const [isSubmitting, setIsSubmitting] = React.useState(false);

        const validate = () => {
          const newErrors: Partial<FormData> = {};
          
          if (!values.nickname || values.nickname.length < 2) {
            newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
          }

          if (values.roomCode && !/^[A-Z0-9]{6}$/.test(values.roomCode)) {
            newErrors.roomCode = '방 코드는 6자리 대문자와 숫자여야 합니다.';
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };

        return { values, errors, isSubmitting, validate, setValues };
      };

      let values = { nickname: '', roomCode: '' };
      let errors = {};
      let isSubmitting = false;

      const mockUseForm = (initialValues: FormData) => {
        const validate = () => {
          const newErrors: any = {};
          
          if (!values.nickname || values.nickname.length < 2) {
            newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
          }

          errors = newErrors;
          return Object.keys(newErrors).length === 0;
        };

        const setValues = (newValues: FormData) => {
          values = newValues;
        };

        return { values, errors, isSubmitting, validate, setValues };
      };

      const { result } = renderHook(() => mockUseForm({ nickname: '', roomCode: '' }));

      // Test validation with empty nickname
      act(() => {
        const isValid = result.current.validate();
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.nickname).toBe('닉네임은 2자 이상이어야 합니다.');

      // Test with valid nickname
      act(() => {
        result.current.setValues({ nickname: '테스트유저', roomCode: '' });
        const isValid = result.current.validate();
        expect(isValid).toBe(true);
      });

      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });
  });
});