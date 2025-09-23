import type {GameStateResponse} from './backendTypes';
import type {WebSocketChatMessage} from './index';

// Shared WebSocket & real-time types
export type MessageType =
  | 'GAME_STATE_UPDATE'
  | 'PHASE_CHANGE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'HINT_SUBMITTED'
  | 'VOTE_CAST'
  | 'DEFENSE_SUBMITTED'
  | 'WORD_GUESSED'
  | 'ROUND_ENDED'
  | 'GAME_ENDED'
  | 'ERROR'
  | 'CHAT_MESSAGE';

export interface IncomingMessage<T = unknown> {
  type: MessageType;
  gameId: string;
  userId?: string;
  timestamp: number;
  payload: T;
}

export interface OutgoingClientMessage<T = unknown> {
  destination: string;
  body: T;
  optimisticUpdateId?: string;
}

export interface GameStateUpdatePayload {
  gameState?: GameStateResponse;
}

export interface PhaseChangePayload { phase: string; previousPhase: string; }
export interface PlayerJoinedPayload { player: unknown; }
export interface PlayerLeftPayload { playerId: string; }
export interface HintSubmittedPayload { playerId: string; hint: string; order: number; }
export interface VoteCastPayload { playerId: string; targetId: string; voteType?: string; }
export interface DefenseSubmittedPayload { playerId: string; defense: string; }
export interface WordGuessedPayload { playerId: string; guess: string; success?: boolean; }
export interface RoundEndedPayload { round: number; results: Record<string, unknown>; }
export interface GameEndedPayload { winners: string[]; scores: Record<string, number>; }
export interface ErrorMessagePayload { code: string; message: string; details?: unknown; }

export type MessagePayloadMap = {
  GAME_STATE_UPDATE: GameStateUpdatePayload;
  PHASE_CHANGE: PhaseChangePayload;
  PLAYER_JOINED: PlayerJoinedPayload;
  PLAYER_LEFT: PlayerLeftPayload;
  HINT_SUBMITTED: HintSubmittedPayload;
  VOTE_CAST: VoteCastPayload;
  DEFENSE_SUBMITTED: DefenseSubmittedPayload;
  WORD_GUESSED: WordGuessedPayload;
  ROUND_ENDED: RoundEndedPayload;
  GAME_ENDED: GameEndedPayload;
  ERROR: ErrorMessagePayload;
  CHAT_MESSAGE: WebSocketChatMessage; // already handled separately
};
