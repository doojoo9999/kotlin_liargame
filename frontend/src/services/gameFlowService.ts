import {apiService} from './api';
import type {
    ChatMessage,
    DefenseResponse,
    FinalVoteResponse,
    GameResult,
    GuessResponse,
    HintSubmissionResponse,
    RoundEndResponse,
    VoteResponse,
} from '../types/gameFlow';

const GAME_BASE = '/api/v1/game';
const CHAT_BASE = '/api/v1/chat';

type ChatSendType = 'GENERAL' | 'HINT' | 'DEFENSE' | 'SYSTEM';

type BackendChatType = 'DISCUSSION' | 'HINT' | 'DEFENSE' | 'SYSTEM';

const mapChatType = (type: ChatSendType): BackendChatType => {
  switch (type) {
    case 'HINT':
      return 'HINT';
    case 'DEFENSE':
      return 'DEFENSE';
    case 'SYSTEM':
      return 'SYSTEM';
    default:
      return 'DISCUSSION';
  }
};

export class GameFlowService {
  async submitHint(gameNumber: number, hint: string): Promise<HintSubmissionResponse> {
    return apiService.post<HintSubmissionResponse>(`${GAME_BASE}/hint`, { gameNumber, hint });
  }

  async castVoteForLiar(gameNumber: number, targetUserId: number): Promise<VoteResponse> {
    return apiService.post<VoteResponse>(`${GAME_BASE}/cast-vote`, { gameNumber, targetUserId });
  }

  async submitDefense(gameNumber: number, defenseText: string): Promise<DefenseResponse> {
    return apiService.post<DefenseResponse>(`${GAME_BASE}/submit-defense`, { gameNumber, defenseText });
  }

  async endDefensePhase(gameNumber: number): Promise<any> {
    return apiService.post(`${GAME_BASE}/defense/end`, { gameNumber });
  }

  async castFinalVote(gameNumber: number, voteForExecution: boolean): Promise<FinalVoteResponse> {
    return apiService.post<FinalVoteResponse>(`${GAME_BASE}/vote/final`, { gameNumber, voteForExecution });
  }

  async guessWord(gameNumber: number, guess: string): Promise<GuessResponse> {
    return apiService.post<GuessResponse>(`${GAME_BASE}/guess-word`, { gameNumber, guess });
  }

  async endRound(gameNumber: number): Promise<RoundEndResponse> {
    return apiService.post<RoundEndResponse>(`${GAME_BASE}/end-of-round`, { gameNumber });
  }

  async getGameResult(gameNumber: number): Promise<GameResult> {
    return apiService.get<GameResult>(`${GAME_BASE}/result/${gameNumber}`);
  }

  async sendChatMessage(gameNumber: number, message: string, type: ChatSendType = 'GENERAL'): Promise<void> {
    await apiService.post(`${CHAT_BASE}/send`, {
      gameNumber,
      content: message,
      type: mapChatType(type)
    });
  }

  async getChatHistory(
    gameNumber: number,
    limit: number = 50,
    type?: ChatSendType
  ): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      gameNumber: String(gameNumber),
      limit: String(limit)
    });

    const mappedType = type && type !== 'GENERAL' ? mapChatType(type) : undefined;
    if (mappedType) {
      params.append('type', mappedType);
    }

    const rawMessages = await apiService.get<any[]>(`${CHAT_BASE}/history?${params.toString()}`);

    return rawMessages.map((message) => {
      const gameNumberParsed = typeof message.gameNumber === 'number'
        ? message.gameNumber
        : Number.parseInt(String(message.gameNumber ?? 0), 10)

      const timestamp = typeof message.timestamp === 'string'
        ? Date.parse(message.timestamp)
        : Number(message.timestamp ?? Date.now())

      const playerNickname = message.playerNickname ?? message.nickname ?? 'SYSTEM'
      const content = message.content ?? message.message ?? ''

      return {
        id: String(message.id ?? `${gameNumberParsed}-${timestamp}`),
        gameNumber: Number.isNaN(gameNumberParsed) ? 0 : gameNumberParsed,
        playerId: message.playerId != null ? String(message.playerId) : undefined,
        userId: typeof message.userId === 'number' ? message.userId : undefined,
        playerNickname,
        nickname: message.nickname ?? undefined,
        playerName: message.playerName ?? undefined,
        content,
        message: content,
        gameId: message.gameId != null ? String(message.gameId) : undefined,
        roomId: message.roomId != null ? String(message.roomId) : undefined,
        timestamp,
        type: (message.type || 'DISCUSSION') as ChatMessage['type']
      } satisfies ChatMessage
    })
  }
}

export const gameFlowService = new GameFlowService();
