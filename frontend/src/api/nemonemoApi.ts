import { apiClient, API_CONFIG } from './client'
import type {
  LeaderboardResponse,
  PuzzleDetail,
  PuzzlePageResponse,
  SessionResponse,
  SessionStartRequest
} from '../types/nemonemo'

export interface ListPuzzleParams {
  page?: number
  size?: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  releasePack?: string
}

export const nemonemoApi = {
  async listPuzzles(params: ListPuzzleParams = {}): Promise<PuzzlePageResponse> {
    const query = new URLSearchParams()
    if (params.page != null) query.set('page', String(params.page))
    if (params.size != null) query.set('size', String(params.size))
    if (params.difficulty) query.set('difficulty', params.difficulty)
    if (params.releasePack) query.set('releasePack', params.releasePack)

    const endpoint = query.toString()
      ? `${API_CONFIG.ENDPOINTS.NEMONEMO.PUZZLES}?${query.toString()}`
      : API_CONFIG.ENDPOINTS.NEMONEMO.PUZZLES

    return apiClient.get<PuzzlePageResponse>(endpoint)
  },

  async getPuzzle(puzzleId: number | string): Promise<PuzzleDetail> {
    const endpoint = API_CONFIG.ENDPOINTS.NEMONEMO.PUZZLE_DETAIL(puzzleId)
    return apiClient.get<PuzzleDetail>(endpoint)
  },

  async startSession(payload: SessionStartRequest): Promise<SessionResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.NEMONEMO.SESSIONS
    return apiClient.post<SessionResponse>(endpoint, payload)
  },

  async getSession(sessionId: number | string): Promise<SessionResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.NEMONEMO.SESSION_DETAIL(sessionId)
    return apiClient.get<SessionResponse>(endpoint)
  },

  async listWeeklyLeaderboard(releasePack: string, scope: 'GLOBAL' | 'FRIENDS' = 'GLOBAL'): Promise<LeaderboardResponse> {
    const query = new URLSearchParams({ releasePack, scope })
    const endpoint = `${API_CONFIG.ENDPOINTS.NEMONEMO.LEADERBOARD_WEEKLY}?${query.toString()}`
    return apiClient.get<LeaderboardResponse>(endpoint)
  }
}
