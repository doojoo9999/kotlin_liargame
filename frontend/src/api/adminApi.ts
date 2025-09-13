import {apiClient} from './client'
import {apiResponse} from '@/utils/apiResponseHandler'
import type {APIResponse} from '@/types'

// Admin interfaces
export interface AdminLoginRequest {
  adminNickname: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  nickname: string;
}

export interface KickPlayerRequest {
  userId: number;
}

export interface TerminateRoomRequest {
  gameNumber: number;
}

export interface ProfanityRequest {
  id: number;
  word: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface GameStatistics {
  totalGames: number;
  activeGames: number;
  totalPlayers: number;
  onlinePlayers: number;
  averageGameDuration: number;
  popularSubjects: Array<{
    subject: string;
    count: number;
  }>;
}

export interface ActiveGame {
  gameNumber: number;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  gameState: string;
  createdAt: string;
  lastActivity: string;
}

export interface PlayerInfo {
  id: number;
  nickname: string;
  isOnline: boolean;
  lastSeen: string;
  gamesPlayed: number;
  winRate: number;
}

export interface PendingContent {
  id: number;
  type: 'SUBJECT' | 'WORD';
  content: string;
  submittedBy: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

class AdminApiService {
  private readonly baseUrl = '/api/v1/admin';

  async login(credentials: AdminLoginRequest): Promise<APIResponse<AdminLoginResponse>> {
    return apiResponse.handle(
      apiClient.post<AdminLoginResponse>(`${this.baseUrl}/login`, credentials),
      'ADMIN_LOGIN_ERROR'
    )
  }

  async kickPlayer(gameNumber: number, userId: number): Promise<APIResponse<{ success: boolean }>> {
    return apiResponse.handle(
      apiClient.post<{ success: boolean }>(`${this.baseUrl}/games/${gameNumber}/kick`, {
        userId
      }),
      'KICK_PLAYER_ERROR'
    )
  }

  async terminateRoom(gameNumber: number): Promise<APIResponse<{ success: boolean }>> {
    return apiResponse.handle(
      apiClient.post<{ success: boolean }>(`${this.baseUrl}/terminate-room`, {
        gameNumber
      }),
      'TERMINATE_ROOM_ERROR'
    )
  }

  async getGameStatistics(): Promise<APIResponse<GameStatistics>> {
    return apiResponse.handle(
      apiClient.get<GameStatistics>(`${this.baseUrl}/statistics`),
      'GET_STATISTICS_ERROR'
    )
  }

  async getAllActiveGames(): Promise<APIResponse<ActiveGame[]>> {
    return apiResponse.handle(
      apiClient.get<ActiveGame[]>(`${this.baseUrl}/games`),
      'GET_ACTIVE_GAMES_ERROR'
    )
  }

  async getAllPlayers(): Promise<APIResponse<PlayerInfo[]>> {
    return apiResponse.handle(
      apiClient.get<PlayerInfo[]>(`${this.baseUrl}/players`),
      'GET_PLAYERS_ERROR'
    )
  }

  async getPendingProfanityRequests(): Promise<APIResponse<ProfanityRequest[]>> {
    return apiResponse.handle(
      apiClient.get<ProfanityRequest[]>(`${this.baseUrl}/profanity/requests`),
      'GET_PROFANITY_REQUESTS_ERROR'
    )
  }

  async approveProfanityRequest(requestId: number): Promise<APIResponse<void>> {
    return apiResponse.handle(
      apiClient.post<void>(`${this.baseUrl}/profanity/approve/${requestId}`),
      'APPROVE_PROFANITY_ERROR'
    )
  }

  async rejectProfanityRequest(requestId: number): Promise<APIResponse<void>> {
    return apiResponse.handle(
      apiClient.post<void>(`${this.baseUrl}/profanity/reject/${requestId}`),
      'REJECT_PROFANITY_ERROR'
    )
  }

  async grantAdminRole(userId: number): Promise<APIResponse<{ success: boolean }>> {
    return apiResponse.handle(
      apiClient.post<{ success: boolean }>(`${this.baseUrl}/grant-role/${userId}`),
      'GRANT_ADMIN_ROLE_ERROR'
    )
  }

  async getPendingContents(): Promise<APIResponse<PendingContent[]>> {
    return apiResponse.handle(
      apiClient.get<PendingContent[]>(`${this.baseUrl}/content/pending`),
      'GET_PENDING_CONTENTS_ERROR'
    )
  }

  async approveAllPendingContents(): Promise<APIResponse<{ success: boolean }>> {
    return apiResponse.handle(
      apiClient.post<{ success: boolean }>(`${this.baseUrl}/content/approve-all`),
      'APPROVE_ALL_CONTENTS_ERROR'
    )
  }

  async cleanupStaleGames(): Promise<APIResponse<{
    success: boolean;
    cleanedGames: number;
    message: string;
  }>> {
    return apiResponse.handle(
      apiClient.post<{
        success: boolean;
        cleanedGames: number;
        message: string;
      }>(`${this.baseUrl}/cleanup/stale-games`),
      'CLEANUP_STALE_GAMES_ERROR'
    )
  }

  async cleanupDisconnectedPlayers(): Promise<APIResponse<{
    success: boolean;
    cleanedPlayers: number;
  }>> {
    return apiResponse.handle(
      apiClient.post<{
        success: boolean;
        cleanedPlayers: number;
      }>(`${this.baseUrl}/cleanup/disconnected-players`),
      'CLEANUP_DISCONNECTED_PLAYERS_ERROR'
    )
  }

  async cleanupEmptyGames(): Promise<APIResponse<{
    success: boolean;
    cleanedGames: number;
    message: string;
  }>> {
    return apiResponse.handle(
      apiClient.post<{
        success: boolean;
        cleanedGames: number;
        message: string;
      }>(`${this.baseUrl}/cleanup/empty-games`),
      'CLEANUP_EMPTY_GAMES_ERROR'
    )
  }
}

export const adminApi = new AdminApiService();