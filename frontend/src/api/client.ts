// API configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:20021',
  WS_URL: 'ws://localhost:20021/ws',
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
    },
    // Game Management
    GAME: {
      CREATE: '/api/game/create',
      JOIN: '/api/game/join',
      LEAVE: '/api/game/leave',
      START: '/api/game/start',
      STATUS: '/api/game/status',
      SETTINGS: '/api/game/settings',
    },
    // Player Actions
    PLAYER: {
      READY: '/api/player/ready',
      VOTE: '/api/player/vote',
      PROFILE: '/api/player/profile',
    },
    // Game Flow
    ROUND: {
      SUBMIT_ANSWER: '/api/round/answer',
      GET_RESULTS: '/api/round/results',
      NEXT_ROUND: '/api/round/next',
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

// WebSocket Client
export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  
  constructor(url: string = API_CONFIG.WS_URL) {
    this.url = url
  }

  connect(gameId?: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = gameId ? `${this.url}?gameId=${gameId}` : this.url
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve(this.ws!)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket closed')
          this.handleReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  onMessage(callback: (data: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          callback(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    }
  }

  close() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
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