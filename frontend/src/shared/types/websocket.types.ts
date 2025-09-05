// WebSocket 관련 타입 정의
import type {GamePhase, GameResult, GameState, Player, VotingRecord} from './game.types';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  gameNumber?: number;
}

// WebSocket 메시지 타입들
export interface PlayerJoinedMessage extends WebSocketMessage {
  type: 'PLAYER_JOINED';
  data: Player;
}

export interface PlayerLeftMessage extends WebSocketMessage {
  type: 'PLAYER_LEFT';
  data: { playerId: string };
}

export interface GameStartedMessage extends WebSocketMessage {
  type: 'GAME_STARTED';
  data: GameState;
}

export interface PhaseChangedMessage extends WebSocketMessage {
  type: 'PHASE_CHANGED';
  data: { gamePhase: GamePhase; timeRemaining?: number };
}

export interface PlayerVotedMessage extends WebSocketMessage {
  type: 'PLAYER_VOTED';
  data: VotingRecord;
}

export interface HintProvidedMessage extends WebSocketMessage {
  type: 'HINT_PROVIDED';
  data: { playerId: string; hint: string };
}

export interface GameEndedMessage extends WebSocketMessage {
  type: 'GAME_ENDED';
  data: GameResult;
}

export interface PlayerEliminatedMessage extends WebSocketMessage {
  type: 'PLAYER_ELIMINATED';
  data: { playerId: string };
}

export interface TimeUpdateMessage extends WebSocketMessage {
  type: 'TIME_UPDATE';
  data: { timeRemaining: number };
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'ERROR';
  data: { message: string; code?: string };
}

// 채팅 메시지 관련 타입 (백엔드 명세에 맞게 수정)
export interface ChatMessage {
  id: number;
  gameNumber: number;
  playerNickname: string;
  content: string;
  timestamp: string;
  type: "HINT" | "DISCUSSION" | "DEFENSE" | "POST_ROUND" | "SYSTEM"; // NORMAL → DISCUSSION 변경
}

export interface ChatMessageReceivedMessage extends WebSocketMessage {
  type: 'CHAT_MESSAGE_RECEIVED';
  data: ChatMessage;
}

export interface ChatMessageSentMessage extends WebSocketMessage {
  type: 'CHAT_MESSAGE_SENT';
  data: ChatMessage;
}

// WebSocket 상태
export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage?: WebSocketMessage;
}

// WebSocket 이벤트 핸들러 타입
export type WebSocketEventHandler<T = any> = (message: T) => void;

export interface WebSocketEventHandlers {
  onPlayerJoined: WebSocketEventHandler<PlayerJoinedMessage>;
  onPlayerLeft: WebSocketEventHandler<PlayerLeftMessage>;
  onGameStarted: WebSocketEventHandler<GameStartedMessage>;
  onPhaseChanged: WebSocketEventHandler<PhaseChangedMessage>;
  onPlayerVoted: WebSocketEventHandler<PlayerVotedMessage>;
  onHintProvided: WebSocketEventHandler<HintProvidedMessage>;
  onGameEnded: WebSocketEventHandler<GameEndedMessage>;
  onPlayerEliminated: WebSocketEventHandler<PlayerEliminatedMessage>;
  onTimeUpdate: WebSocketEventHandler<TimeUpdateMessage>;
  onError: WebSocketEventHandler<ErrorMessage>;
  onChatMessage: WebSocketEventHandler<ChatMessage>;
}
