import {apiClient} from './client';
import type {
    DefenseResponse,
    GameListResponse,
    GameRoomInfo,
    GuessResponse,
    JoinGameRequest,
    VoteResponse
} from '../types/api';
import type {
    CountdownResponse,
    CreateGameRequest,
    GameMode,
    GameStateResponse,
    PlayerReadyResponse,
    PlayerResponse,
    VotingStatusResponse
} from '../types/backendTypes';
import type {ChatMessage, RoundEndResponse} from '../types/gameFlow';

export class GameService {
  private static instance: GameService;

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private static toNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }

  private static toBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }
    return fallback;
  }

  private static toString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : fallback;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return fallback;
  }

  private static toOptionalString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  private static toOptionalNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  private static toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map(item => GameService.toString(item, '').trim())
      .filter(subject => subject.length > 0);
  }

  private static normalizePlayers(value: unknown): PlayerResponse[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(GameService.isRecord)
      .map(playerRecord => {
        const id = GameService.toNumber(playerRecord['id'] ?? playerRecord['playerId']);
        const userId = GameService.toNumber(playerRecord['userId'] ?? playerRecord['userID'] ?? playerRecord['id'], id);
        const nickname = GameService.toString(playerRecord['nickname'] ?? playerRecord['playerName'], '');
        const state = GameService.toString(playerRecord['state'], 'WAITING_FOR_HINT') as PlayerResponse['state'];
        const hint = GameService.toOptionalString(playerRecord['hint']);
        const defense = GameService.toOptionalString(playerRecord['defense']);
        const votesReceived = GameService.toOptionalNumber(playerRecord['votesReceived']);

        const normalized: PlayerResponse = {
          id,
          userId,
          nickname,
          isAlive: GameService.toBoolean(playerRecord['isAlive'], true),
          state,
          hasVoted: GameService.toBoolean(playerRecord['hasVoted'], false)
        };

        if (hint !== null) {
          normalized.hint = hint;
        }
        if (defense !== null) {
          normalized.defense = defense;
        }
        if (votesReceived !== null) {
          normalized.votesReceived = votesReceived;
        }
        return normalized;
      })
      .filter(player => player.nickname.length > 0);
  }

  private static normalizeRoom(room: Record<string, unknown>): GameRoomInfo {
    const rawNumber = room['gameNumber'] ?? room['gameId'] ?? room['id'];
    const gameNumber = GameService.toNumber(rawNumber);
    const fallbackTitle = gameNumber > 0 ? `Game #${gameNumber}` : 'Game';
    const title = GameService.toString(room['title'] ?? room['gameName'], fallbackTitle);
    const host = GameService.toString(room['host'] ?? room['gameOwner'], 'Unknown');
    const currentPlayers = GameService.toNumber(room['currentPlayers'] ?? room['gameParticipants'] ?? room['participants']);
    const maxPlayers = GameService.toNumber(room['maxPlayers'] ?? room['gameMaxPlayers'] ?? room['capacity']);
    const hasPassword = GameService.toBoolean(room['hasPassword'] ?? room['isPrivate']);
    const state = GameService.toString(room['state'] ?? room['gameState'], 'WAITING') as GameRoomInfo['state'];
    const subjects = GameService.toStringArray(room['subjects']);
    const subject = GameService.toOptionalString(room['subject'] ?? room['citizenSubject']);
    const players = GameService.normalizePlayers(room['players']);
    const modeValue = room['gameMode'] ?? room['mode'];
    const normalizedMode = typeof modeValue === 'string' ? (modeValue as GameRoomInfo['gameMode']) : undefined;

    return {
      gameNumber,
      title,
      host,
      currentPlayers,
      maxPlayers,
      hasPassword,
      state,
      subjects,
      subject,
      players,
      gameName: GameService.toString(room['gameName'], title),
      gameOwner: GameService.toString(room['gameOwner'], host),
      gameParticipants: GameService.toNumber(room['gameParticipants'] ?? currentPlayers),
      gameMaxPlayers: GameService.toNumber(room['gameMaxPlayers'] ?? maxPlayers),
      isPrivate: GameService.toBoolean(room['isPrivate'] ?? hasPassword),
      gameState: state,
      gameMode: normalizedMode
    } satisfies GameRoomInfo;
  }

  private static extractRooms(response: unknown): Record<string, unknown>[] {
    if (!GameService.isRecord(response)) {
      return [];
    }

    const record = response as Record<string, unknown>;
    const candidateKeys: string[] = ['gameRooms', 'games', 'data'];

    for (const key of candidateKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.filter(GameService.isRecord) as Record<string, unknown>[];
      }
    }

    const dataValue = record['data'];
    if (GameService.isRecord(dataValue)) {
      const nested = GameService.extractRooms(dataValue);
      if (nested.length > 0) {
        return nested;
      }
    }

    return [];
  }

  private static isGameListResponse(value: unknown): value is GameListResponse {
    if (!GameService.isRecord(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;
    return typeof record['success'] === 'boolean' && Array.isArray(record['gameRooms']);
  }

  // 게임방 목록 조회

  async getGameList(page: number = 0, size: number = 10): Promise<GameListResponse> {
    const response = await apiClient.get<unknown>(`/api/v1/game/rooms?page=${page}&size=${size}`);
    const roomRecords = GameService.extractRooms(response);

    if (roomRecords.length > 0) {
      const normalized = roomRecords.map(room => GameService.normalizeRoom(room));
      const result: GameListResponse = {
        success: true,
        data: normalized,
        gameRooms: normalized,
        games: normalized,
        timestamp: Date.now()
      };

      if (GameService.isRecord(response)) {
        const pagination = (response as Record<string, unknown>)['pagination'];
        if (GameService.isRecord(pagination)) {
          result.pagination = pagination as GameListResponse['pagination'];
        }
      }

      return result;
    }

    if (GameService.isGameListResponse(response)) {
      return response;
    }

    return {
      success: true,
      data: [],
      gameRooms: [],
      games: [],
      timestamp: Date.now()
    };
  }

  // 게임방 생성
  async createGame(gameData: CreateGameRequest): Promise<number> {
    const payload = {
      ...gameData,
      gamePassword: gameData.gamePassword ?? null,
      subjectIds: gameData.subjectIds && gameData.subjectIds.length > 0 ? gameData.subjectIds : undefined,
      useRandomSubjects: gameData.useRandomSubjects ?? (gameData.subjectIds == null),
      randomSubjectCount: gameData.randomSubjectCount ?? (gameData.useRandomSubjects ? 1 : undefined)
    };
    const response = await apiClient.post<number>('/api/v1/game/create', payload);
    return response;
  }

  // 게임방 참여
  async joinGame(joinData: JoinGameRequest): Promise<GameStateResponse> {
    const payload: JoinGameRequest = {
      gameNumber: joinData.gameNumber,
      gamePassword: joinData.gamePassword ?? joinData.password ?? undefined,
      nickname: joinData.nickname
    };
    const response = await apiClient.post<GameStateResponse>('/api/v1/game/join', payload);
    return response;
  }

  // 게임방 나가기
  async leaveGame(gameNumber: number): Promise<boolean> {
    const response = await apiClient.post<boolean>(`/api/v1/game/leave`, { gameNumber });
    return response;
  }

  // 게임 상태 조회
  async getGameState(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.get<GameStateResponse>(`/api/v1/game/${gameNumber}`);
    return response;
  }

  // 게임 시작
  async startGame(): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/start`);
    return response;
  }

  // 플레이어 준비 상태 변경
  async toggleReady(gameNumber: number): Promise<PlayerReadyResponse> {
    const response = await apiClient.post<PlayerReadyResponse>(`/api/v1/game/${gameNumber}/ready`);
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
  async getReadyStatus(gameNumber: number): Promise<PlayerReadyResponse[]> {
    const response = await apiClient.get<PlayerReadyResponse[]>(`/api/v1/game/${gameNumber}/ready-status`);
    return response;
  }

  // 카운트다운 상태 조회
  async getCountdownStatus(gameNumber: number): Promise<CountdownResponse | null> {
    const response = await apiClient.get<CountdownResponse | null>(`/api/v1/game/${gameNumber}/countdown/status`);
    return response;
  }

  // 연결 상태 조회
  async getConnectionStatus(gameNumber: number): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/game/${gameNumber}/connection-status`);
    return response;
  }

  // 투표 상태 조회
  async getVotingStatus(gameNumber: number): Promise<VotingStatusResponse> {
    const response = await apiClient.get<VotingStatusResponse>(`/api/v1/game/${gameNumber}/voting-status`);
    return response;
  }

  // 카운트다운 시작
  async startCountdown(gameNumber: number, durationSeconds: number = 10): Promise<CountdownResponse> {
    const response = await apiClient.post<CountdownResponse>(`/api/v1/game/${gameNumber}/countdown/start`, {
      durationSeconds
    });
    return response;
  }

  // 카운트다운 취소
  async cancelCountdown(gameNumber: number): Promise<CountdownResponse> {
    const response = await apiClient.post<CountdownResponse>(`/api/v1/game/${gameNumber}/countdown/cancel`);
    return response;
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
  async vote(gameNumber: number, voteData: { targetUserId: number }): Promise<VoteResponse> {
    const response = await apiClient.post<VoteResponse>(`/api/v1/game/cast-vote`, {
      gameNumber,
      targetUserId: voteData.targetUserId
    });
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
  async getChatHistory(gameNumber: number, page: number = 0, size: number = 50): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      gameNumber: String(gameNumber),
      limit: String(size)
    });
    if (page > 0) {
      params.append('page', String(page));
    }
    const rawMessages = await apiClient.get<any[]>(`/api/v1/chat/history?${params.toString()}`)
    return rawMessages.map((message) => {
      const content = message.content ?? message.message ?? ''
      const nickname = message.playerNickname ?? message.nickname ?? 'SYSTEM'
      const timestamp =
        typeof message.timestamp === 'string'
          ? Date.parse(message.timestamp)
          : Number(message.timestamp ?? Date.now())

      return {
        id: String(message.id ?? `${message.gameNumber ?? 0}-${timestamp}`),
        gameNumber: Number(message.gameNumber ?? 0),
        playerNickname: nickname,
        nickname,
        content,
        message: content,
        timestamp,
        type: (message.type || 'DISCUSSION') as ChatMessage['type']
      } satisfies ChatMessage
    })
  }

  // 채팅 메시지 전송
  async sendChatMessage(gameNumber: number, content: string, type: 'DISCUSSION' | 'HINT' | 'DEFENSE' | 'SYSTEM' = 'DISCUSSION'): Promise<any> {
    const response = await apiClient.post<any>(`/api/v1/chat/send`, { 
      gameNumber,
      content, 
      type 
    });
    return response;
  }

  // 힌트 제출 (구형 - 호환성용)
  async submitHintOld(gameId: string, hint: string): Promise<void> {
    const gameNumber = parseInt(gameId);
    await this.submitHint(gameNumber, hint);
  }

  // 변론 제출 (구형 - 호환성용)  
  async submitDefenseOld(gameId: string, defense: string): Promise<DefenseResponse> {
    const gameNumber = parseInt(gameId);
    return this.submitDefense(gameNumber, defense);
  }

  // 단어 추측
  async guessWord(gameNumber: number, guess: string): Promise<GuessResponse> {
    const response = await apiClient.post<GuessResponse>(`/api/v1/game/guess-word`, { 
      gameNumber, 
      guess 
    });
    return response;
  }

  // 힌트 제출 (백엔드 API와 매치)
  async submitHint(gameNumber: number, hint: string): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/hint`, {
      gameNumber,
      hint
    });
    return response;
  }

  // 투표 제출 (새로운 cast-vote 방식)
  async castVote(gameNumber: number, targetUserId: number): Promise<VoteResponse> {
    const response = await apiClient.post<VoteResponse>(`/api/v1/game/cast-vote`, {
      gameNumber,
      targetUserId
    });
    return response;
  }

  // 변론 제출
  async submitDefense(gameNumber: number, defenseText: string): Promise<DefenseResponse> {
    const response = await apiClient.post<DefenseResponse>(`/api/v1/game/submit-defense`, {
      gameNumber,
      defenseText
    });
    return response;
  }

  // 변론 즉시 종료
  async endDefense(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/defense/end`, {
      gameNumber
    });
    return response;
  }

  // 최종 투표 (처형/생존)
  async submitFinalVote(gameNumber: number, voteForExecution: boolean): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/vote/final`, {
      gameNumber,
      voteForExecution
    });
    return response;
  }

  // 라이어 단어 추측 (기존 방식 호환)
  async submitLiarGuess(gameNumber: number, guess: string): Promise<GuessResponse> {
    const response = await apiClient.post<GuessResponse>(`/api/v1/game/submit-liar-guess`, {
      gameNumber,
      guess
    });
    return response;
  }

  // 라운드 종료
  async endRound(gameNumber: number): Promise<GameStateResponse> {
    const response = await apiClient.post<GameStateResponse>(`/api/v1/game/end-of-round`, {
      gameNumber
    });
    return response;
  }

  // 게임 상태 복구
  async recoverGameState(gameNumber: number): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/game/recover-state/${gameNumber}`);
    return response;
  }

  // 게임 결과 조회  
  async getGameResult(gameNumber: number): Promise<any> {
    const response = await apiClient.get<any>(`/api/v1/game/result/${gameNumber}`);
    return response;
  }

  // 사용자 게임 데이터 정리
  async cleanupUserGameData(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/api/v1/game/cleanup/user-data');
    return response;
  }
}

// 싱글톤 인스턴스 export
export const gameService = GameService.getInstance();

// 별칭 export for compatibility
export const gameApi = gameService;
