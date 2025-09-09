import {API_CONFIG, apiClient} from './client';
import type {
    CreateGameRequest,
    GameListResponse,
    GameMode,
    GameRoomInfo,
    GameStateResponse,
    JoinGameRequest
} from '../types/game';

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
    const response = await apiClient.get<GameListResponse>(`${API_CONFIG.ENDPOINTS.GAME.ROOMS}?page=${page}&size=${size}`);
    return response;
  }

  // 게임방 생성
  async createGame(gameData: CreateGameRequest): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(API_CONFIG.ENDPOINTS.GAME.CREATE, gameData);
    return response;
  }

  // 게임방 참여
  async joinGame(joinData: JoinGameRequest): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(API_CONFIG.ENDPOINTS.GAME.JOIN, joinData);
    return response;
  }

  // 게임방 나가기
  async leaveGame(gameNumber: number): Promise<void> {
    await apiClient.post<void>(API_CONFIG.ENDPOINTS.GAME.LEAVE, { gameNumber });
  }

  // 게임 상태 조회
  async getGameState(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.get<GameStateResponse>(`${API_CONFIG.ENDPOINTS.GAME.STATE}/${gameNumber}`);
    return response;
  }

  // 게임 시작
  async startGame(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(API_CONFIG.ENDPOINTS.GAME.START, { gameNumber });
    return response;
  }

  // 게임 상태 복구
  async recoverGameState(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.get<GameStateResponse>(`${API_CONFIG.ENDPOINTS.GAME.RECOVER_STATE}/${gameNumber}`);
    return response;
  }

  // 특정 게임방 정보 조회
  async getGameInfo(gameNumber: number): Promise<GameRoomInfo> {
    const response = await apiClient.get<GameRoomInfo>(`${API_CONFIG.ENDPOINTS.GAME.STATE}/${gameNumber}`);
    return response;
  }

  // 게임 모드 목록 조회 (백엔드에 해당 엔드포인트가 없으므로 기본값 반환)
  async getAvailableGameModes(): Promise<GameMode[]> {
    return [
      { id: 'standard', name: '일반 모드', description: '기본 라이어 게임' },
      { id: 'quick', name: '빠른 모드', description: '시간 단축 모드' },
    ];
  }

  // 채팅 관련 메서드들
  async sendChatMessage(gameNumber: number, messageData: { content: string; senderId: string; senderName: string }): Promise<void> {
    await apiClient.post(API_CONFIG.ENDPOINTS.CHAT.SEND, {
      gameNumber,
      ...messageData
    });
  }

  async getChatHistory(gameNumber: number): Promise<{ messages: any[] }> {
    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.CHAT.HISTORY}?gameNumber=${gameNumber}`);
    return response;
  }
}

// 싱글톤 인스턴스 export
export const gameService = GameService.getInstance();
