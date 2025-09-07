import {API_CONFIG, apiClient} from './client'

// API Request/Response Types
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
  gameId?: string
}

export interface LoginResponse {
  playerId: string
  token: string
  nickname: string
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
    return apiClient.get<GameStatusResponse>(`${API_CONFIG.ENDPOINTS.GAME.STATUS}?gameId=${gameId}`)
  },

  async updateGameSettings(gameId: string, settings: Partial<CreateGameRequest>): Promise<void> {
    return apiClient.put<void>(API_CONFIG.ENDPOINTS.GAME.SETTINGS, { gameId, ...settings })
  },

  // Player Actions
  async setReady(gameId: string, ready: boolean): Promise<void> {
    return apiClient.post<void>(API_CONFIG.ENDPOINTS.PLAYER.READY, { gameId, ready })
  },

  async vote(gameId: string, data: VoteRequest): Promise<VoteResponse> {
    return apiClient.post<VoteResponse>(API_CONFIG.ENDPOINTS.PLAYER.VOTE, { gameId, ...data })
  },

  async getPlayerProfile(playerId: string): Promise<any> {
    return apiClient.get<any>(`${API_CONFIG.ENDPOINTS.PLAYER.PROFILE}?playerId=${playerId}`)
  },

  // Round Actions
  async submitAnswer(gameId: string, answer: string): Promise<void> {
    return apiClient.post<void>(API_CONFIG.ENDPOINTS.ROUND.SUBMIT_ANSWER, { gameId, answer })
  },

  async getRoundResults(gameId: string): Promise<any> {
    return apiClient.get<any>(`${API_CONFIG.ENDPOINTS.ROUND.GET_RESULTS}?gameId=${gameId}`)
  },

  async nextRound(gameId: string): Promise<void> {
    return apiClient.post<void>(API_CONFIG.ENDPOINTS.ROUND.NEXT_ROUND, { gameId })
  },
}