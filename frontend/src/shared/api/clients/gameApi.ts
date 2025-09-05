import {apiClient} from '../apiClient';
import type {
    ChatHistoryRequest,
    ChatHistoryResponse,
    ChatMessage,
    ChatSendRequest,
    DefenseRequest,
    DefenseResponse,
    FinalVoteRequest,
    FinalVoteResponse,
    GameCreateRequest,
    GameCreateResponse,
    GameJoinRequest,
    GameJoinResponse,
    HintRequest,
    HintResponse,
    LiarGuessRequest,
    LiarGuessResponse,
    LoginRequest,
    LoginResponse,
    RefreshSessionRequest,
    RefreshSessionResponse,
    VoteRequest,
    VoteResponse
} from '../../types/api.types';
import {API_ENDPOINTS} from '../endpoints';

// ===============================
// 인증 API
// ===============================

export const authApi = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      request
    );
    return data;
  },

  refreshSession: async (request: RefreshSessionRequest): Promise<RefreshSessionResponse> => {
    const { data } = await apiClient.post<RefreshSessionResponse>(
      API_ENDPOINTS.AUTH.REFRESH_SESSION,
      request
    );
    return data;
  }
};

// ===============================
// 게임 API
// ===============================

export const gameApi = {
  create: async (request: GameCreateRequest): Promise<GameCreateResponse> => {
    const { data } = await apiClient.post<GameCreateResponse>(
      API_ENDPOINTS.GAME.CREATE,
      request
    );
    return data; // 숫자 반환
  },

  join: async (request: GameJoinRequest): Promise<GameJoinResponse> => {
    const { data } = await apiClient.post<GameJoinResponse>(
      API_ENDPOINTS.GAME.JOIN,
      request
    );
    return data;
  },

  provideHint: async (request: HintRequest): Promise<HintResponse> => {
    const { data } = await apiClient.post<HintResponse>(
      API_ENDPOINTS.GAME.HINT,
      request
    );
    return data;
  },

  // 신규 투표 API 사용
  castVote: async (request: VoteRequest): Promise<VoteResponse> => {
    const { data } = await apiClient.post<VoteResponse>(
      API_ENDPOINTS.GAME.VOTE,
      request
    );
    return data;
  },

  submitDefense: async (request: DefenseRequest): Promise<DefenseResponse> => {
    const { data } = await apiClient.post<DefenseResponse>(
      API_ENDPOINTS.GAME.DEFENSE,
      request
    );
    return data;
  },

  finalVote: async (request: FinalVoteRequest): Promise<FinalVoteResponse> => {
    const { data } = await apiClient.post<FinalVoteResponse>(
      API_ENDPOINTS.GAME.FINAL_VOTE,
      request
    );
    return data;
  },

  // 신규 라이어 추측 API 사용
  guessWord: async (request: LiarGuessRequest): Promise<LiarGuessResponse> => {
    const { data } = await apiClient.post<LiarGuessResponse>(
      API_ENDPOINTS.GAME.LIAR_GUESS,
      request
    );
    return data;
  }
};

// ===============================
// 채팅 API
// ===============================

export const chatApi = {
  send: async (request: ChatSendRequest): Promise<ChatMessage> => {
    const { data } = await apiClient.post<ChatMessage>(
      API_ENDPOINTS.CHAT.SEND,
      request
    );
    return data;
  },

  // 채팅 기록 조회는 POST 방식임에 주의
  getHistory: async (request: ChatHistoryRequest): Promise<ChatHistoryResponse> => {
    const { data } = await apiClient.post<ChatHistoryResponse>(
      API_ENDPOINTS.CHAT.HISTORY,
      request
    );
    return data;
  }
};

// ===============================
// API 클라이언트 통합 export
// ===============================

export const api = {
  auth: authApi,
  game: gameApi,
  chat: chatApi
};
