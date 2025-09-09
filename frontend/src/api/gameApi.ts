import {API_CONFIG, apiClient} from './client'
import type {
    ConnectionStatusResponse,
    CountdownResponse,
    PlayerReadyResponse,
    VotingStatusResponse
} from '@/types/realtime'

export interface CreateGameRequest {
  maxPlayers: number
  timeLimit: number
  totalRounds: number
}

export interface CreateGameResponse {
  gameId: string
  sessionCode: string
  hostId: string
}

export interface JoinGameRequest {
  sessionCode: string
  nickname: string
}

export interface JoinGameResponse {
  gameId: string
  playerId: string
  players: any[]
}

export interface LoginRequest {
  nickname: string
  password?: string | null
}

export interface LoginResponse {
  success: boolean
  userId: number | null  
  nickname: string | null
  message?: string | null
}

export interface GameStatusResponse {
  gameId: string
  phase: string
  players: any[]
  currentRound: number
  totalRounds: number
  timeRemaining?: number
  currentTopic?: string
}

export interface VoteRequest {
  suspectedLiarId: string
}

export interface VoteResponse {
  success: boolean
  results?: {
    votes: Record<string, number>
    actualLiar: string
    winners: string[]
  }
}

// API Functions
export const gameApi = {
  // Authentication
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data)
  },

  async logout(): Promise<void> {
    return apiClient.post<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT)
  },

  // Game Management
  async createGame(data: CreateGameRequest): Promise<CreateGameResponse> {
    return apiClient.post<CreateGameResponse>(API_CONFIG.ENDPOINTS.GAME.CREATE, data)
  },

  async joinGame(data: JoinGameRequest): Promise<JoinGameResponse> {
    return apiClient.post<JoinGameResponse>(API_CONFIG.ENDPOINTS.GAME.JOIN, data)
  },

  async leaveGame(gameId: string): Promise<void> {
    return apiClient.post<void>(API_CONFIG.ENDPOINTS.GAME.LEAVE, { gameId })
  },

  async startGame(gameId: string): Promise<void> {
    return apiClient.post<void>(API_CONFIG.ENDPOINTS.GAME.START, { gameId })
  },

  async getGameStatus(gameId: string): Promise<GameStatusResponse> {
    // REST 스타일: /api/v1/game/{gameId}
    return apiClient.get<GameStatusResponse>(`${API_CONFIG.ENDPOINTS.GAME.STATE}/${gameId}`)
  },

  async updateGameSettings(gameId: string, settings: Partial<CreateGameRequest>): Promise<void> {
    // 실제 경로로 직접 호출 (키 불일치 방지)
    return apiClient.put<void>('/api/v1/game/settings', { gameId, ...settings })
  },

  // Player Actions
  async setReady(gameId: string, ready: boolean): Promise<void> {
    return apiClient.post<void>('/api/v1/game/player/ready', { gameId, ready })
  },

  async vote(gameId: string, data: VoteRequest): Promise<VoteResponse> {
    return apiClient.post<VoteResponse>('/api/v1/game/player/vote', { gameId, ...data })
  },

  async getPlayerProfile(playerId: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/player/profile?playerId=${playerId}`)
  },

  async submitAnswer(gameId: string, answer: string): Promise<void> {
    return apiClient.post<void>('/api/v1/game/round/submit-answer', { gameId, answer })
  },

  async getRoundResults(gameId: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/game/round/results?gameId=${gameId}`)
  },

  async nextRound(gameId: string): Promise<void> {
    return apiClient.post<void>('/api/v1/game/round/next', { gameId })
  },

  async toggleReady(gameNumber: number): Promise<void> {
    return apiClient.post<void>(`/api/v1/game/${gameNumber}/ready`)
  },

  async getReadyStatus(gameNumber: number): Promise<PlayerReadyResponse[]> {
    return apiClient.get<PlayerReadyResponse[]>(`/api/v1/game/${gameNumber}/ready-status`)
  },

  async startCountdown(gameNumber: number): Promise<void> {
    return apiClient.post<void>(`/api/v1/game/${gameNumber}/countdown/start`)
  },

  async cancelCountdown(gameNumber: number): Promise<void> {
    return apiClient.post<void>(`/api/v1/game/${gameNumber}/countdown/cancel`)
  },

  async getCountdownStatus(gameNumber: number): Promise<CountdownResponse> {
    return apiClient.get<CountdownResponse>(`/api/v1/game/${gameNumber}/countdown/status`)
  },

  async getConnectionStatus(gameNumber: number): Promise<ConnectionStatusResponse> {
    return apiClient.get<ConnectionStatusResponse>(`/api/v1/game/${gameNumber}/connection-status`)
  },

  async getVotingStatus(gameNumber: number): Promise<VotingStatusResponse> {
    return apiClient.get<VotingStatusResponse>(`/api/v1/game/${gameNumber}/voting-status`)
  },
}