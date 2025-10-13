import {clearClientSessionState} from "@/utils/sessionCleanup"

const DEFAULT_API_BASE_URL = 'http://localhost:20021'
const DEFAULT_WS_PATH = '/ws'

function normalizeBaseUrl(url: string | undefined, fallback: string): string {
  const candidate = url?.trim()
  if (!candidate) {
    return fallback
  }
  return candidate.replace(/\/$/, '')
}

function resolveWebSocketUrl(explicitUrl: string | undefined, baseHttpUrl: string): string {
  const sanitizedBase = baseHttpUrl.replace(/\/$/, '')

  const candidate = explicitUrl?.trim()
  if (candidate) {
    const sanitizedCandidate = candidate.replace(/\/$/, '')

    if (sanitizedCandidate.startsWith('ws://') || sanitizedCandidate.startsWith('wss://')) {
      return sanitizedCandidate
    }

    if (sanitizedCandidate.startsWith('http://') || sanitizedCandidate.startsWith('https://')) {
      const wsBase = sanitizedCandidate.replace(/^http/, 'ws')
      return wsBase.endsWith(DEFAULT_WS_PATH) ? wsBase : `${wsBase}${DEFAULT_WS_PATH}`
    }

    return sanitizedCandidate
  }

  const wsBase = sanitizedBase.replace(/^http/, 'ws')
  return `${wsBase}${DEFAULT_WS_PATH}`
}

const baseURL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, DEFAULT_API_BASE_URL)
const wsURL = resolveWebSocketUrl(import.meta.env.VITE_WEBSOCKET_URL, baseURL)

// API configuration
export const API_CONFIG = {
  BASE_URL: baseURL,
  WS_URL: wsURL, // ✅ 올바른 WebSocket 엔드포인트
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout', 
      REFRESH: '/api/v1/auth/refresh-session',
      CHECK: '/api/v1/auth/check',
    },
    // Game Management (완전한 GameController API)
    GAME: {
      // 기본 게임 관리
      CREATE: '/api/v1/game/create',
      JOIN: '/api/v1/game/join',
      LEAVE: '/api/v1/game/leave', 
      START: '/api/v1/game/start',
      ROOMS: '/api/v1/game/rooms',           // 게임방 목록
      STATE: '/api/v1/game',                 // /{gameNumber}
      RESULT: '/api/v1/game/result',         // /result/{gameNumber}
      RECOVER_STATE: '/api/v1/game/recover-state', // /recover-state/{gameNumber}

      // 게임 진행 관련
      HINT: '/api/v1/game/hint',
      VOTE: '/api/v1/game/vote',
      FINAL_VOTE: '/api/v1/game/vote/final',
      CAST_VOTE: '/api/v1/game/cast-vote',
      GUESS_WORD: '/api/v1/game/guess-word',
      END_ROUND: '/api/v1/game/end-of-round',
      
      // 변론 관련
      SUBMIT_DEFENSE: '/api/v1/game/submit-defense',
      END_DEFENSE: '/api/v1/game/defense/end',
      SUBMIT_LIAR_GUESS: '/api/v1/game/submit-liar-guess',
      
      // 방장 관리
      KICK_OWNER: '/api/v1/game',            // /{gameNumber}/kick-owner
      EXTEND_TIME: '/api/v1/game',           // /{gameNumber}/extend-time
      
      // 데이터 정리
      CLEANUP_USER_DATA: '/api/v1/game/cleanup/user-data'
    },
    // Chat System (완전한 ChatController API)
    CHAT: {
      SEND: '/api/v1/chat/send',
      HISTORY: '/api/v1/chat/history',
      POST_ROUND: '/api/v1/chat/post-round', // /post-round/{gameNumber}
      SPEECH_COMPLETE: '/api/v1/chat/speech/complete',
    },
    // Subject Management (완전한 SubjectController API)
    SUBJECT: {
      LIST: '/api/v1/subjects/listsubj',     // 실제 경로
      CREATE: '/api/v1/subjects/applysubj',  // 실제 경로
      DELETE: '/api/v1/subjects/delsubj',    // /delsubj/{id}
      APPROVE_PENDING: '/api/v1/subjects/approve-pending',
    },
    // Word Management (완전한 WordController API)
    WORD: {
      LIST: '/api/v1/words/wlist',           // 실제 경로
      CREATE: '/api/v1/words/applyw',        // 실제 경로
      DELETE: '/api/v1/words/delw',          // /delw/{id}
      APPROVE_PENDING: '/api/v1/words/approve-pending',
    },
    // User Management
    USER: {
      ADD: '/api/v1/user/add',
      STATS: '/api/v1/user/stats',
    },
    // Admin Management (완전한 AdminController API)
    ADMIN: {
      LOGIN: '/api/v1/admin/login',
      KICK_PLAYER: '/api/v1/admin/games',    // /games/{gameNumber}/kick
      TERMINATE_ROOM: '/api/v1/admin/terminate-room',
      GRANT_ROLE: '/api/v1/admin/grant-role', // /grant-role/{userId}
      STATISTICS: '/api/v1/admin/statistics',
      GAMES: '/api/v1/admin/games',
      PLAYERS: '/api/v1/admin/players',
      CONTENT_PENDING: '/api/v1/admin/content/pending',
      CONTENT_APPROVE_ALL: '/api/v1/admin/content/approve-all',
      CLEANUP_STALE: '/api/v1/admin/cleanup/stale-games',
      CLEANUP_DISCONNECTED: '/api/v1/admin/cleanup/disconnected-players',
      CLEANUP_EMPTY: '/api/v1/admin/cleanup/empty-games',
      PROFANITY_REQUESTS: '/api/v1/admin/profanity/requests',
      PROFANITY_APPROVE: '/api/v1/admin/profanity/approve', // /approve/{requestId}
      PROFANITY_REJECT: '/api/v1/admin/profanity/reject',   // /reject/{requestId}
    },
    // Profanity Management
    PROFANITY: {
      SUGGEST: '/api/v1/profanity/suggest',
    },
    // Nemonemo Puzzle API
    NEMONEMO: {
      PUZZLES: '/api/nemonemo/v1/puzzles',
      PUZZLE_DETAIL: (puzzleId: number | string) => `/api/nemonemo/v1/puzzles/${puzzleId}`,
      SESSIONS: '/api/nemonemo/v1/sessions',
      SESSION_DETAIL: (sessionId: number | string) => `/api/nemonemo/v1/sessions/${sessionId}`,
      SESSION_ACTIONS: (sessionId: number | string) => `/api/nemonemo/v1/sessions/${sessionId}/actions`,
      LEADERBOARD_WEEKLY: '/api/nemonemo/v1/leaderboards/weekly',
    }
  },
  // WebSocket 메시지 경로 (백엔드 @MessageMapping과 일치) 
  WEBSOCKET: {
    // 송신할 때 사용 (클라이언트 → 서버)
    SEND: {
      CHAT: '/app/chat.send',                    // @MessageMapping("/chat.send")
      VOTE: '/app/game/{gameNumber}/vote',       // @MessageMapping("/game/{gameNumber}/vote")
      GUESS_TOPIC: '/app/game/{gameNumber}/guess-topic', // @MessageMapping("/game/{gameNumber}/guess-topic")
      HEARTBEAT: '/app/heartbeat',               // @MessageMapping("/heartbeat")
    },
    // 구독할 때 사용 (서버 → 클라이언트)
    SUBSCRIBE: {
      GAME_EVENTS: '/topic/game/{gameNumber}',   // 게임 이벤트 브로드캐스트
      CHAT_MESSAGES: '/topic/chat.{gameNumber}', // 채팅 메시지
      GAME_STATE: '/topic/game/{gameNumber}/state', // 게임 상태 변경
      USER_EVENTS: '/topic/user/{userId}',       // 개인 알림
    }
  }
} as const

// HTTP Client wrapper
class ApiClient {
  private baseURL: string
  private isRefreshing: boolean = false
  private refreshPromise: Promise<void> | null = null
  
  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      ...options,
      method: 'POST'
    }

    if (data !== undefined) {
      config.body = JSON.stringify(data)
    }

    return this.request<T>(endpoint, config)
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      ...options,
      method: 'PUT'
    }

    if (data !== undefined) {
      config.body = JSON.stringify(data)
    }

    return this.request<T>(endpoint, config)
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuthFailure: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include', // 쿠키와 세션을 포함하여 요청
      ...options,
    }

    // Session-based authentication only - no Bearer tokens needed
    // Backend uses session cookies for authentication

    // 요청 상세 정보 로깅
    console.log('API Request:', {
      method: config.method || 'GET',
      url,
      headers: config.headers,
      body: config.body,
      credentials: config.credentials
    });

    try {
      const response = await fetch(url, config)

      // 응답 상세 정보 로깅
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      // Handle 401/403 unauthorized responses 
      if ((response.status === 401 || response.status === 403) && retryOnAuthFailure && !endpoint.includes('/auth/')) {
        console.log('Unauthorized response, attempting session refresh...');
        
        // Wait for any ongoing refresh to complete
        if (this.refreshPromise) {
          await this.refreshPromise;
        } else if (!this.isRefreshing) {
          await this.refreshSession();
        }
        
        // Retry the original request once
        return this.request<T>(endpoint, options, false);
      }

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
          }
        } else {
          try {
            errorData.text = await response.text();
          } catch (textError) {
            console.error('Failed to read error response as text:', textError);
          }
        }

        console.error('API Error Response:', errorData);

        const errorMessage =
          typeof errorData.message === 'string' ? errorData.message :
          typeof errorData.error === 'string' ? errorData.error :
          typeof errorData.text === 'string' ? errorData.text :
          `HTTP ${response.status}: ${response.statusText}`;

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('API Response Data:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Session refresh method
  private async refreshSession(): Promise<void> {
    if (this.isRefreshing) {
      // If already refreshing, wait for the existing promise
      if (this.refreshPromise) {
        return this.refreshPromise;
      }
    }

    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        console.log('Attempting to refresh session...');
        const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Session refresh successful:', data);
        } else {
          console.error('Session refresh failed:', response.status, response.statusText);
          // Clear auth state on refresh failure
          this.clearAuthState();
          throw new Error('Session refresh failed');
        }
      } catch (error) {
        console.error('Session refresh error:', error);
        this.clearAuthState();
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Clear authentication state
  private clearAuthState(): void {
    if (typeof window === 'undefined') {
      return;
    }

    void clearClientSessionState({
      reason: 'session-expired',
    });
  }
}

export const apiClient = new ApiClient()

// Note: WebSocket implementation moved to /services/websocketService.ts
// This uses SockJS+STOMP for proper backend integration
// Import websocketService from '../services/websocketService' instead

export { websocketService as wsClient } from '../services/websocketService'
