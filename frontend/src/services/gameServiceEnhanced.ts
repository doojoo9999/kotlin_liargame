import {apiClient} from '../api/client';
import type {
    ChatHistoryResponse,
    ChatMessage,
    ChatMessageType,
    ConnectionStatusResponse,
    CountdownResponse,
    CreateGameRequest,
    DefenseSubmissionResponse,
    GameStateResponse,
    LiarGuessResultResponse,
    PlayerReadyResponse,
    VoteResponse,
    VotingStatusResponse
} from '../types/backendTypes';

/**
 * Enhanced Game Service aligned with Backend API Documentation
 * This service provides complete integration with the Kotlin backend
 */
export class EnhancedGameService {
  private static instance: EnhancedGameService;

  static getInstance(): EnhancedGameService {
    if (!EnhancedGameService.instance) {
      EnhancedGameService.instance = new EnhancedGameService();
    }
    return EnhancedGameService.instance;
  }

  // ============= Authentication APIs =============
  
  async login(nickname: string, password?: string): Promise<{
    success: boolean;
    userId?: number;
    nickname?: string;
  }> {
    const response = await apiClient.post('/api/v1/auth/login', {
      nickname,
      password: password || 'defaultPassword'
    });
    return response;
  }

  async logout(): Promise<{ success: boolean }> {
    const response = await apiClient.post('/api/v1/auth/logout');
    return response;
  }

  async refreshSession(): Promise<{
    success: boolean;
    userId?: number;
    nickname?: string;
    message?: string;
  }> {
    const response = await apiClient.post('/api/v1/auth/refresh-session');
    return response;
  }

  // ============= Game Management APIs =============

  async createGame(gameData: CreateGameRequest): Promise<number> {
    // Backend returns game number as plain integer
    const gameNumber = await apiClient.post<number>('/api/v1/game/create', gameData);
    return gameNumber;
  }

  async joinGame(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/join', {
      gameNumber
    });
    return response;
  }

  async leaveGame(gameNumber: number): Promise<boolean> {
    const response = await apiClient.post<boolean>('/api/v1/game/leave', {
      gameNumber
    });
    return response;
  }

  async getGameState(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.get<GameStateResponse>(`/api/v1/game/${gameNumber}`);
    return response;
  }

  async recoverGameState(gameNumber: number): Promise<{
    gameNumber: number;
    gameState: string;
    defense: any;
    player: any;
    timestamp: string;
  }> {
    const response = await apiClient.get(`/api/v1/game/recover-state/${gameNumber}`);
    return response;
  }

  async startGame(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/start', {
      gameNumber
    });
    return response;
  }

  // ============= Ready & Countdown System =============

  async toggleReady(gameNumber: number): Promise<PlayerReadyResponse> {
    const response = await apiClient.post<PlayerReadyResponse>(`/api/v1/game/${gameNumber}/ready`);
    return response;
  }

  async getReadyStatus(gameNumber: number): Promise<PlayerReadyResponse[]> {
    const response = await apiClient.get<PlayerReadyResponse[]>(`/api/v1/game/${gameNumber}/ready-status`);
    return response;
  }

  async startCountdown(gameNumber: number, durationSeconds: number = 10): Promise<CountdownResponse> {
    const response = await apiClient.post<CountdownResponse>(`/api/v1/game/${gameNumber}/countdown/start`, {
      durationSeconds
    });
    return response;
  }

  async cancelCountdown(gameNumber: number): Promise<CountdownResponse> {
    const response = await apiClient.post<CountdownResponse>(`/api/v1/game/${gameNumber}/countdown/cancel`);
    return response;
  }

  async getCountdownStatus(gameNumber: number): Promise<CountdownResponse> {
    const response = await apiClient.get<CountdownResponse>(`/api/v1/game/${gameNumber}/countdown/status`);
    return response;
  }

  // ============= Connection Management =============

  async getConnectionStatus(gameNumber: number): Promise<ConnectionStatusResponse> {
    const response = await apiClient.get<ConnectionStatusResponse>(`/api/v1/game/${gameNumber}/connection-status`);
    return response;
  }

  // ============= Voting System =============

  async getVotingStatus(gameNumber: number): Promise<VotingStatusResponse> {
    const response = await apiClient.get<VotingStatusResponse>(`/api/v1/game/${gameNumber}/voting-status`);
    return response;
  }

  // Legacy vote method (keeping for backward compatibility)
  async vote(gameNumber: number, targetPlayerId: number): Promise<any> {
    const response = await apiClient.post('/api/v1/game/vote', {
      gameNumber,
      targetPlayerId
    });
    return response;
  }

  // New enhanced voting method
  async castVote(gameNumber: number, targetUserId: number): Promise<VoteResponse> {
    const response = await apiClient.post<VoteResponse>('/api/v1/game/cast-vote', {
      gameNumber,
      targetUserId
    });
    return response;
  }

  async castFinalVote(gameNumber: number, voteForExecution: boolean): Promise<any> {
    const response = await apiClient.post('/api/v1/game/vote/final', {
      gameNumber,
      voteForExecution
    });
    return response;
  }

  // ============= Game Actions =============

  async submitHint(gameNumber: number, hint: string): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/hint', {
      gameNumber,
      hint
    });
    return response;
  }

  async submitDefense(gameNumber: number, defenseText: string): Promise<DefenseSubmissionResponse> {
    const response = await apiClient.post<DefenseSubmissionResponse>('/api/v1/game/submit-defense', {
      gameNumber,
      defenseText
    });
    return response;
  }

  async endDefense(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/defense/end', {
      gameNumber
    });
    return response;
  }

  // Legacy guess method
  async submitLiarGuess(gameNumber: number, guess: string): Promise<LiarGuessResultResponse> {
    const response = await apiClient.post<LiarGuessResultResponse>('/api/v1/game/submit-liar-guess', {
      gameNumber,
      guess
    });
    return response;
  }

  // New enhanced guess method
  async guessWord(gameNumber: number, guess: string): Promise<LiarGuessResultResponse> {
    const response = await apiClient.post<LiarGuessResultResponse>('/api/v1/game/guess-word', {
      gameNumber,
      guess
    });
    return response;
  }

  async endRound(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/end-of-round', {
      gameNumber
    });
    return response;
  }

  // ============= Chat System =============

  async sendChatMessage(gameNumber: number, content: string, type: ChatMessageType = 'DISCUSSION'): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>('/api/v1/chat/send', {
      gameNumber,
      content,
      type
    });
    return response;
  }

  async getChatHistory(gameNumber: number, page: number = 0, size: number = 50): Promise<ChatHistoryResponse> {
    const response = await apiClient.post<ChatHistoryResponse>('/api/v1/chat/history', {
      gameNumber,
      page,
      size
    });
    return response;
  }

  // ============= Game Rooms =============

  async getActiveGameRooms(): Promise<{
    gameRooms: Array<{
      gameNumber: number;
      gameOwner: string;
      gameState: string;
      gameParticipants: number;
      currentPlayerCount: number;
      gameLiarCount: number;
      gameTotalRounds: number;
      gameMode: string;
      createdAt: string;
      subjects: string[];
    }>
  }> {
    const response = await apiClient.get('/api/v1/game/rooms');
    return response;
  }

  async getGameResult(gameNumber: number): Promise<{
    gameNumber: number;
    winningTeam: 'CITIZENS' | 'LIARS';
    players: Array<{
      id: number;
      nickname: string;
      role: 'CITIZEN' | 'LIAR';
      isAlive: boolean;
      isWinner: boolean;
    }>;
    gameStatistics: {
      totalRounds: number;
      currentRound: number;
      totalDuration: number;
      averageRoundDuration: number;
    };
  }> {
    const response = await apiClient.get(`/api/v1/game/result/${gameNumber}`);
    return response;
  }

  // ============= Utility Methods =============

  /**
   * Check if the current session is valid
   */
  async checkSessionValidity(): Promise<boolean> {
    try {
      const result = await this.refreshSession();
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Convert frontend CreateGameRequest to backend format
   */
  convertToBackendCreateRequest(frontendRequest: {
    maxPlayers: number;
    timeLimit: number;
    totalRounds: number;
    gameMode?: string;
    subjectIds?: number[];
    targetPoints?: number;
  }): CreateGameRequest {
    return {
      gameParticipants: frontendRequest.maxPlayers,
      gameLiarCount: Math.max(1, Math.floor(frontendRequest.maxPlayers / 3)), // Default calculation
      gameTotalRounds: frontendRequest.totalRounds,
      gameMode: (frontendRequest.gameMode as any) || 'LIARS_KNOW',
      subjectIds: frontendRequest.subjectIds || [],
      useRandomSubjects: !frontendRequest.subjectIds || frontendRequest.subjectIds.length === 0,
      randomSubjectCount: frontendRequest.subjectIds ? undefined : 3,
      targetPoints: frontendRequest.targetPoints || 10
    };
  }

  /**
   * Get localized phase name for UI
   */
  getPhaseDisplayName(phase: string): string {
    const phaseNames: Record<string, string> = {
      'WAITING_FOR_PLAYERS': '플레이어 대기',
      'SPEECH': '힌트 제공',
      'VOTING_FOR_LIAR': '라이어 투표',
      'DEFENDING': '변론',
      'VOTING_FOR_SURVIVAL': '최종 투표',
      'GUESSING_WORD': '단어 추측',
      'GAME_OVER': '게임 종료'
    };
    return phaseNames[phase] || phase;
  }

  /**
   * Get phase-specific available actions for current player
   */
  getAvailableActions(gameState: GameStateResponse, currentUserId: number): string[] {
    const actions: string[] = [];
    const currentPlayer = gameState.players.find(p => p.userId === currentUserId);
    
    if (!currentPlayer) return actions;

    switch (gameState.currentPhase) {
      case 'WAITING_FOR_PLAYERS':
        actions.push('TOGGLE_READY');
        if (gameState.gameOwner === currentPlayer.nickname) {
          actions.push('START_COUNTDOWN');
        }
        break;
        
      case 'SPEECH':
        if (currentPlayer.state === 'WAITING_FOR_HINT') {
          actions.push('SUBMIT_HINT');
        }
        break;
        
      case 'VOTING_FOR_LIAR':
        if (currentPlayer.state === 'WAITING_FOR_VOTE') {
          actions.push('CAST_VOTE');
        }
        break;
        
      case 'DEFENDING':
        if (currentPlayer.id === gameState.accusedPlayer && currentPlayer.state === 'ACCUSED') {
          actions.push('SUBMIT_DEFENSE', 'END_DEFENSE');
        }
        break;
        
      case 'VOTING_FOR_SURVIVAL':
        if (currentPlayer.state === 'WAITING_FOR_FINAL_VOTE') {
          actions.push('CAST_FINAL_VOTE');
        }
        break;
        
      case 'GUESSING_WORD':
        if (gameState.yourRole === 'LIAR') {
          actions.push('GUESS_WORD');
        }
        break;
    }
    
    // Chat is available in most phases
    if (['WAITING_FOR_PLAYERS', 'DEFENDING', 'GAME_OVER'].includes(gameState.currentPhase)) {
      actions.push('SEND_CHAT');
    }
    
    return actions;
  }
}

// Singleton instance
export const enhancedGameService = EnhancedGameService.getInstance();
