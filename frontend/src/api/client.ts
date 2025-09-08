// API configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:20021',
  WS_URL: 'ws://localhost:20021/ws', // ✅ 올바른 WebSocket 엔드포인트
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
      CHAT_MESSAGES: '/topic/chat/{gameNumber}', // 채팅 메시지
      GAME_STATE: '/topic/game/{gameNumber}/state', // 게임 상태 변경
      USER_EVENTS: '/topic/user/{userId}',       // 개인 알림
    }
  }
} as const

// HTTP Client wrapper
class ApiClient {
  private baseURL: string
  
  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('auth-token')
    if (token) {
      (config.headers as any)['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()

// WebSocket Client using SockJS and STOMP (백엔드와 호환)
export class WebSocketClient {
  private stompClient: any = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  
  constructor(url: string = API_CONFIG.WS_URL) {
    this.url = url
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // SockJS와 STOMP 클라이언트 설정이 필요합니다
        // 현재는 네이티브 WebSocket으로 연결
        console.log('Connecting to WebSocket:', this.url)
        
        // 임시로 네이티브 WebSocket 사용 (추후 SockJS/STOMP로 업그레이드 필요)
        const ws = new WebSocket(this.url)
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully')
          this.reconnectAttempts = 0
          resolve(true)
        }

        ws.onerror = (error) => {
          console.error('WebSocket connection failed:', error)
          reject(error)
        }

        ws.onclose = () => {
          console.log('WebSocket connection closed')
          this.handleReconnect()
        }

        this.stompClient = ws // 임시 저장
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        reject(error)
      }
    })
  }

  // STOMP 메시지 송신 (백엔드 @MessageMapping으로)
  sendMessage(destination: string, message: any) {
    if (this.stompClient && this.stompClient.readyState === WebSocket.OPEN) {
      // 임시로 JSON 메시지 전송 (실제로는 STOMP 프레임 필요)
      const stompMessage = {
        destination: destination,
        body: JSON.stringify(message)
      }
      this.stompClient.send(JSON.stringify(stompMessage))
      console.log('Message sent to:', destination, message)
    } else {
      console.error('WebSocket is not connected')
    }
  }

  // Topic 구독 (백엔드 /topic에서 브로드캐스트)
  subscribe(topic: string, callback: (message: any) => void) {
    console.log('Subscribed to topic:', topic)
    // 임시 구현 - 실제로는 STOMP subscribe 필요
    if (this.stompClient) {
      this.stompClient.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.destination === topic) {
            callback(JSON.parse(data.body))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.close()
      this.stompClient = null
      console.log('WebSocket disconnected')
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }
}

export const wsClient = new WebSocketClient()