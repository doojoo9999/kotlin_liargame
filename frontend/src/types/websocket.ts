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

export interface IncomingMessage<T = any> {
  type: MessageType;
  gameId: string;
  userId?: string;
  timestamp: number;
  payload: T;
}

export interface OutgoingClientMessage<T = any> {
  destination: string;
  body: T;
  optimisticUpdateId?: string;
}

export interface GameStateUpdatePayload {
  // shape kept flexible; align later with backend contract
  gameState: any;
}

export interface PhaseChangePayload { phase: string; previousPhase: string; }
export interface PlayerJoinedPayload { player: any; }
export interface PlayerLeftPayload { playerId: string; }
export interface HintSubmittedPayload { playerId: string; hint: string; order: number; }
export interface VoteCastPayload { playerId: string; targetId: string; voteType?: string; }
export interface DefenseSubmittedPayload { playerId: string; defense: string; }
export interface WordGuessedPayload { playerId: string; guess: string; success?: boolean; }
export interface RoundEndedPayload { round: number; results: any; }
export interface GameEndedPayload { winners: string[]; scores: Record<string, number>; }
export interface ErrorMessagePayload { code: string; message: string; details?: any; }

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
  CHAT_MESSAGE: any; // already handled separately
};
