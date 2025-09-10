import {apiClient} from './client';
import type {
    CreateGameRequest,
    GameListResponse,
    GameMode,
    GameRoomInfo,
    GameStateResponse,
    JoinGameRequest
} from '../types/game';
import type {ChatMessage, DefenseResponse, GuessResponse, RoundEndResponse, VoteResponse} from '../types/gameFlow';

export class GameService {
  private static instance: GameService;

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  // 게임방 목록 조회
  async getGameList(page: number = 0, size: number = 10): Promise<GameListResponse> {
    const response = await apiClient.get<GameListResponse>(`/api/v1/game/rooms?page=${page}&size=${size}`);
    return response;
  }

  // 게임방 생성
  async createGame(gameData: CreateGameRequest): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/create', gameData);
    return response;
  }

  // 게임방 참여
  async joinGame(joinData: JoinGameRequest): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/join', joinData);
    return response;
  }

  // 게임방 나가기
  async leaveGame(gameNumber: number): Promise<void> {
    await apiClient.post<void>(`/api/v1/game/${gameNumber}/leave`);
  }

  // 게임 상태 조회
  async getGameState(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.get<GameStateResponse>(`/api/v1/game/${gameNumber}/state`);
    return response;
  }

  // 게임 시작
  async startGame(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/${gameNumber}/start`);
    return response;
  }

  // 플레이어 준비 상태 변경
  async toggleReady(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/${gameNumber}/ready`);
    return response;
  }

  // 게임 모드 목록 조회
  async getGameModes(): Promise<GameMode[]> {
    const response = await apiClient.get<GameMode[]>('/api/v1/game/modes');
    return response;
  }

  // 사용 가능한 게임 모드 목록 조회 (별칭)
  async getAvailableGameModes(): Promise<GameMode[]> {
    return this.getGameModes();
  }

  // 플레이어 준비 상태 조회
  async getReadyStatus(gameNumber: number): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/api/v1/game/${gameNumber}/ready-status`);
    return response;
  }

  // 카운트다운 상태 조회
  async getCountdownStatus(gameNumber: number): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/game/${gameNumber}/countdown-status`);
    return response;
  }

  // 연결 상태 조회
  async getConnectionStatus(gameNumber: number): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/game/${gameNumber}/connection-status`);
    return response;
  }

  // 투표 상태 조회
  async getVotingStatus(gameNumber: number): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/game/${gameNumber}/voting-status`);
    return response;
  }

  // 카운트다운 시작
  async startCountdown(gameNumber: number): Promise<void> {
    await apiClient.post<void>(`/api/v1/game/${gameNumber}/countdown/start`);
  }

  // 카운트다운 취소
  async cancelCountdown(gameNumber: number): Promise<void> {
    await apiClient.post<void>(`/api/v1/game/${gameNumber}/countdown/cancel`);
  }


  // 특정 게임방 정보 조회
  async getGameInfo(gameNumber: number): Promise<GameRoomInfo> {
    const response = await apiClient.get<GameRoomInfo>(`/api/v1/game/${gameNumber}/info`);
    return response;
  }

  // 플레이어 준비 상태 설정 (useGameQueries.ts에서 필요)
  async setReady(gameId: string, ready: boolean): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/${gameId}/ready`, { ready });
    return response;
  }

  // 투표하기 (useGameQueries.ts에서 필요)
  async vote(gameId: string, voteData: { suspectedLiarId: string }): Promise<VoteResponse> {
    const response = await apiClient.post<VoteResponse>(`/api/v1/game/${gameId}/vote`, voteData);
    return response;
  }

  // 라운드 결과 조회 (GameEndPanel.tsx에서 필요)
  async getRoundResults(gameId: string): Promise<RoundEndResponse> {
    const response = await apiClient.get<RoundEndResponse>(`/api/v1/game/${gameId}/round-results`);
    return response;
  }

  // 게임 상태 조회 (useGameQueries.ts 호환성)
  async getGameStatus(gameId: string): Promise<GameStateResponse> {
    return this.getGameState(parseInt(gameId));
  }

  // 로그인 (useGameQueries.ts에서 필요)
  async login(loginData: { nickname: string; gameNumber?: number }): Promise<{
    success: boolean;
    userId?: number;
    nickname?: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      userId?: number;
      nickname?: string;
    }>('/api/v1/auth/login', loginData);
    return response;
  }

  // 답안 제출 (useGameQueries.ts에서 필요)
  async submitAnswer(gameId: string, answer: string): Promise<GuessResponse> {
    const response = await apiClient.post<GuessResponse>(`/api/v1/game/${gameId}/submit-answer`, { answer });
    return response;
  }

  // 채팅 메시지 조회
  async getChatHistory(gameId: string): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/api/v1/game/${gameId}/chat`);
    return response;
  }

  // 채팅 메시지 전송
  async sendChatMessage(gameId: string, message: string, type: 'GENERAL' | 'HINT' | 'DEFENSE' = 'GENERAL'): Promise<void> {
    await apiClient.post<void>(`/api/v1/game/${gameId}/chat`, { message, type });
  }

  // 힌트 제출
  async submitHint(gameId: string, hint: string): Promise<void> {
    await apiClient.post<void>(`/api/v1/game/${gameId}/hint`, { hint });
  }

  // 변론 제출
  async submitDefense(gameId: string, defense: string): Promise<DefenseResponse> {
    const response = await apiClient.post<DefenseResponse>(`/api/v1/game/${gameId}/defense`, { defense });
    return response;
  }

  // 단어 추측
  async guessWord(gameId: string, guess: string): Promise<GuessResponse> {
    const response = await apiClient.post<GuessResponse>(`/api/v1/game/${gameId}/guess`, { guess });
    return response;
  }
}

// 싱글톤 인스턴스 export
export const gameService = GameService.getInstance();

// 별칭 export for compatibility
export const gameApi = gameService;
