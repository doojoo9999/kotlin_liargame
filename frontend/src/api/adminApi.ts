import {apiClient} from './client';

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

  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    const response = await apiClient.post(`${this.baseUrl}/login`, credentials);
    return response.data;
  }

  async kickPlayer(gameNumber: number, userId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`${this.baseUrl}/games/${gameNumber}/kick`, {
      userId
    });
    return response.data;
  }

  async terminateRoom(gameNumber: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`${this.baseUrl}/terminate-room`, {
      gameNumber
    });
    return response.data;
  }

  async getGameStatistics(): Promise<GameStatistics> {
    const response = await apiClient.get(`${this.baseUrl}/statistics`);
    return response.data;
  }

  async getAllActiveGames(): Promise<ActiveGame[]> {
    const response = await apiClient.get(`${this.baseUrl}/games`);
    return response.data.games;
  }

  async getAllPlayers(): Promise<PlayerInfo[]> {
    const response = await apiClient.get(`${this.baseUrl}/players`);
    return response.data;
  }

  async getPendingProfanityRequests(): Promise<ProfanityRequest[]> {
    const response = await apiClient.get(`${this.baseUrl}/profanity/requests`);
    return response.data;
  }

  async approveProfanityRequest(requestId: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/profanity/approve/${requestId}`);
  }

  async rejectProfanityRequest(requestId: number): Promise<void> {
    await apiClient.post(`${this.baseUrl}/profanity/reject/${requestId}`);
  }

  async grantAdminRole(userId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`${this.baseUrl}/grant-role/${userId}`);
    return response.data;
  }

  async getPendingContents(): Promise<PendingContent[]> {
    const response = await apiClient.get(`${this.baseUrl}/content/pending`);
    return response.data;
  }

  async approveAllPendingContents(): Promise<{ success: boolean }> {
    const response = await apiClient.post(`${this.baseUrl}/content/approve-all`);
    return response.data;
  }

  async cleanupStaleGames(): Promise<{
    success: boolean;
    cleanedGames: number;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/cleanup/stale-games`);
    return response.data;
  }

  async cleanupDisconnectedPlayers(): Promise<{
    success: boolean;
    cleanedPlayers: number;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/cleanup/disconnected-players`);
    return response.data;
  }

  async cleanupEmptyGames(): Promise<{
    success: boolean;
    cleanedGames: number;
    message: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/cleanup/empty-games`);
    return response.data;
  }
}

export const adminApi = new AdminApiService();