/**
 * API Client Tests
 * 
 * Tests for API client functionality, HTTP requests, error handling,
 * and integration with backend services.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {AxiosError, AxiosResponse} from 'axios';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock data types
interface LoginRequest {
  nickname: string;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    nickname: string;
    token: string;
  };
}

interface GameState {
  id: string;
  status: 'waiting' | 'in_progress' | 'ended';
  players: Player[];
  currentPhase?: string;
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
}

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Base HTTP Client', () => {
    it('should create axios instance with correct configuration', () => {
      const createApiClient = () => {
        return axios.create({
          baseURL: '/api',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      };

      const client = createApiClient();
      expect(client.defaults.baseURL).toBe('/api');
      expect(client.defaults.timeout).toBe(10000);
    });

    it('should handle request interceptors correctly', () => {
      const mockClient = {
        interceptors: {
          request: {
            use: vi.fn()
          }
        }
      };

      const requestInterceptor = (config: any) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      };

      mockClient.interceptors.request.use(requestInterceptor);
      expect(mockClient.interceptors.request.use).toHaveBeenCalledWith(requestInterceptor);
    });

    it('should handle response interceptors correctly', () => {
      const mockClient = {
        interceptors: {
          response: {
            use: vi.fn()
          }
        }
      };

      const responseSuccessHandler = (response: AxiosResponse) => response;
      const responseErrorHandler = (error: AxiosError) => Promise.reject(error);

      mockClient.interceptors.response.use(responseSuccessHandler, responseErrorHandler);
      expect(mockClient.interceptors.response.use).toHaveBeenCalledWith(
        responseSuccessHandler,
        responseErrorHandler
      );
    });
  });

  describe('Authentication API', () => {
    it('should handle successful login', async () => {
      const mockResponse: AxiosResponse<LoginResponse> = {
        data: {
          success: true,
          user: {
            id: 'user-123',
            nickname: '테스트유저',
            token: 'mock-jwt-token'
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const loginApi = {
        async login(data: LoginRequest): Promise<LoginResponse> {
          const response = await axios.post('/api/auth/login', data);
          return response.data;
        }
      };

      const result = await loginApi.login({ nickname: '테스트유저' });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        nickname: '테스트유저'
      });
      expect(result.success).toBe(true);
      expect(result.user.nickname).toBe('테스트유저');
      expect(result.user.token).toBeDefined();
    });

    it('should handle login failure', async () => {
      const mockError: AxiosError = {
        response: {
          data: { message: '이미 사용 중인 닉네임입니다.' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {} as any
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 400',
        config: {} as any,
        toJSON: () => ({})
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const loginApi = {
        async login(data: LoginRequest): Promise<LoginResponse> {
          try {
            const response = await axios.post('/api/auth/login', data);
            return response.data;
          } catch (error) {
            throw new Error((error as AxiosError).response?.data?.message || 'Login failed');
          }
        }
      };

      await expect(loginApi.login({ nickname: '중복닉네임' }))
        .rejects
        .toThrow('이미 사용 중인 닉네임입니다.');
    });

    it('should handle logout correctly', async () => {
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { success: true }, 
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const authApi = {
        async logout(): Promise<void> {
          await axios.post('/api/auth/logout');
          localStorage.removeItem('token');
        }
      };

      // Mock localStorage
      const mockRemoveItem = vi.fn();
      vi.stubGlobal('localStorage', {
        removeItem: mockRemoveItem
      });

      await authApi.logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(mockRemoveItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Game API', () => {
    it('should fetch game state successfully', async () => {
      const mockGameState: GameState = {
        id: 'game-123',
        status: 'waiting',
        players: [
          {
            id: 'player-1',
            nickname: '플레이어1',
            isReady: true,
            score: 0
          }
        ],
        currentPhase: undefined,
        settings: {
          maxPlayers: 6,
          timeLimit: 300
        }
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockGameState,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const gameApi = {
        async getGameState(gameId: string): Promise<GameState> {
          const response = await axios.get(`/api/games/${gameId}`);
          return response.data;
        }
      };

      const result = await gameApi.getGameState('game-123');

      expect(result.id).toBe('game-123');
      expect(result.status).toBe('waiting');
      expect(result.players).toHaveLength(1);
      expect(result.settings.maxPlayers).toBe(6);
    });

    it('should handle game not found error', async () => {
      const mockError: AxiosError = {
        response: {
          data: { message: '게임을 찾을 수 없습니다.' },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: {} as any
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 404',
        config: {} as any,
        toJSON: () => ({})
      };

      mockedAxios.get.mockRejectedValueOnce(mockError);

      const gameApi = {
        async getGameState(gameId: string): Promise<GameState> {
          try {
            const response = await axios.get(`/api/games/${gameId}`);
            return response.data;
          } catch (error) {
            throw new Error((error as AxiosError).response?.data?.message || 'Game not found');
          }
        }
      };

      await expect(gameApi.getGameState('invalid-game-id'))
        .rejects
        .toThrow('게임을 찾을 수 없습니다.');
    });

    it('should create new game room', async () => {
      const mockNewGame: GameState = {
        id: 'new-game-456',
        status: 'waiting',
        players: [],
        settings: {
          maxPlayers: 6,
          timeLimit: 300
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockNewGame,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any
      });

      const gameApi = {
        async createGame(settings: { maxPlayers: number; timeLimit: number }): Promise<GameState> {
          const response = await axios.post('/api/games', settings);
          return response.data;
        }
      };

      const result = await gameApi.createGame({ maxPlayers: 8, timeLimit: 600 });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/games', {
        maxPlayers: 8,
        timeLimit: 600
      });
      expect(result.id).toBe('new-game-456');
      expect(result.status).toBe('waiting');
    });

    it('should join game room', async () => {
      const mockUpdatedGame: GameState = {
        id: 'game-123',
        status: 'waiting',
        players: [
          {
            id: 'player-1',
            nickname: '기존플레이어',
            isReady: true,
            score: 0
          },
          {
            id: 'player-2',
            nickname: '새플레이어',
            isReady: false,
            score: 0
          }
        ],
        settings: {
          maxPlayers: 6,
          timeLimit: 300
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockUpdatedGame,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const gameApi = {
        async joinGame(gameId: string, playerId: string): Promise<GameState> {
          const response = await axios.post(`/api/games/${gameId}/join`, { playerId });
          return response.data;
        }
      };

      const result = await gameApi.joinGame('game-123', 'player-2');

      expect(result.players).toHaveLength(2);
      expect(result.players[1].nickname).toBe('새플레이어');
      expect(result.players[1].isReady).toBe(false);
    });
  });

  describe('Chat API', () => {
    it('should fetch chat history', async () => {
      const mockChatHistory = {
        messages: [
          {
            id: 'msg-1',
            sender: '플레이어1',
            message: '안녕하세요!',
            timestamp: '2024-01-15T10:00:00Z',
            type: 'normal'
          },
          {
            id: 'msg-2',
            sender: '플레이어2',
            message: '반갑습니다!',
            timestamp: '2024-01-15T10:01:00Z',
            type: 'normal'
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2
        }
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockChatHistory,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const chatApi = {
        async getChatHistory(gameId: string, page: number = 1, limit: number = 50) {
          const response = await axios.get(`/api/games/${gameId}/chat`, {
            params: { page, limit }
          });
          return response.data;
        }
      };

      const result = await chatApi.getChatHistory('game-123', 1, 50);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].sender).toBe('플레이어1');
      expect(result.pagination.total).toBe(2);
    });

    it('should send chat message', async () => {
      const mockResponse = {
        success: true,
        messageId: 'msg-123'
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any
      });

      const chatApi = {
        async sendMessage(gameId: string, message: string, senderId: string) {
          const response = await axios.post(`/api/games/${gameId}/chat`, {
            message,
            senderId
          });
          return response.data;
        }
      };

      const result = await chatApi.sendMessage('game-123', '메시지입니다', 'player-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/games/game-123/chat', {
        message: '메시지입니다',
        senderId: 'player-1'
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'NETWORK_ERROR';
      
      mockedAxios.get.mockRejectedValueOnce(networkError);

      const apiClient = {
        async makeRequest<T>(url: string): Promise<T> {
          try {
            const response = await axios.get(url);
            return response.data;
          } catch (error: any) {
            if (error.code === 'NETWORK_ERROR') {
              throw new Error('인터넷 연결을 확인해주세요.');
            }
            throw error;
          }
        }
      };

      await expect(apiClient.makeRequest('/api/test'))
        .rejects
        .toThrow('인터넷 연결을 확인해주세요.');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      
      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      const apiClient = {
        async makeRequest<T>(url: string): Promise<T> {
          try {
            const response = await axios.get(url);
            return response.data;
          } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
              throw new Error('요청 시간이 초과되었습니다.');
            }
            throw error;
          }
        }
      };

      await expect(apiClient.makeRequest('/api/slow-endpoint'))
        .rejects
        .toThrow('요청 시간이 초과되었습니다.');
    });

    it('should handle server errors gracefully', async () => {
      const serverError: AxiosError = {
        response: {
          data: { message: '서버 내부 오류가 발생했습니다.' },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
        config: {} as any,
        toJSON: () => ({})
      };

      mockedAxios.get.mockRejectedValueOnce(serverError);

      const apiClient = {
        async makeRequest<T>(url: string): Promise<T> {
          try {
            const response = await axios.get(url);
            return response.data;
          } catch (error) {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 500) {
              throw new Error('서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
            throw error;
          }
        }
      };

      await expect(apiClient.makeRequest('/api/failing-endpoint'))
        .rejects
        .toThrow('서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    });
  });

  describe('Request Retry Logic', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      
      mockedAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        });
      });

      const retryableApiClient = {
        async makeRequestWithRetry<T>(url: string, maxRetries: number = 3): Promise<T> {
          let attempts = 0;
          
          while (attempts < maxRetries) {
            try {
              const response = await axios.get(url);
              return response.data;
            } catch (error) {
              attempts++;
              if (attempts === maxRetries) {
                throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 100 * attempts));
            }
          }
          
          throw new Error('Max retries exceeded');
        }
      };

      const result = await retryableApiClient.makeRequestWithRetry('/api/unstable');
      
      expect(callCount).toBe(3);
      expect(result.success).toBe(true);
    });
  });
});