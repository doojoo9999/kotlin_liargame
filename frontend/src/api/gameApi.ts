import {apiClient} from './client';
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
    const response = await apiClient.get<GameListResponse>(`/api/v1/game/list?page=${page}&size=${size}`);
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

  // 특정 게임방 정보 조회
  async getGameInfo(gameNumber: number): Promise<GameRoomInfo> {
    const response = await apiClient.get<GameRoomInfo>(`/api/v1/game/${gameNumber}/info`);
    return response;
  }
}

// 싱글톤 인스턴스 export
export const gameService = GameService.getInstance();
