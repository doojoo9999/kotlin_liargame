/**
 * Backend API Types - Aligned with Backend API Documentation
 */

export const GAME_FLOW_SCHEMA_VERSION = 'game-flow/2024-09-18';
export const REALTIME_SCHEMA_VERSION = 'game-realtime/2024-09-18';

// Game Phase Types from Backend
export type GamePhase = 
  | 'WAITING_FOR_PLAYERS'
  | 'SPEECH'
  | 'VOTING_FOR_LIAR' 
  | 'DEFENDING'
  | 'VOTING_FOR_SURVIVAL'
  | 'GUESSING_WORD'
  | 'GAME_OVER';

export type GameState = 'WAITING' | 'IN_PROGRESS' | 'ENDED';

export type GameMode = 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';

export type PlayerState = 
  | 'WAITING_FOR_HINT'
  | 'GAVE_HINT'
  | 'WAITING_FOR_VOTE'
  | 'VOTED'
  | 'ACCUSED'
  | 'DEFENDED'
  | 'WAITING_FOR_FINAL_VOTE'
  | 'FINAL_VOTED'
  | 'SURVIVED'
  | 'ELIMINATED'
  | 'DISCONNECTED';

export type ChatMessageType = 'HINT' | 'DISCUSSION' | 'DEFENSE' | 'POST_ROUND' | 'SYSTEM';

export type ConnectionStability = 'STABLE' | 'UNSTABLE' | 'POOR';

// Backend API Request/Response Types
export interface CreateGameRequest {
  nickname?: string;
  gameName?: string;
  gamePassword?: string | null;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameMode: GameMode;
  subjectIds?: number[];
  useRandomSubjects?: boolean;
  randomSubjectCount?: number;
  targetPoints: number;
}

export interface JoinGameRequest {
  gameNumber: number;
  gamePassword?: string;
  nickname?: string;
}

export interface GameStateResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  gameName: string;
  gameOwner: string;
  gameState: GameState;
  currentPhase: GamePhase;
  players: BackendPlayer[];
  gameMode: GameMode;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameCurrentRound: number;
  yourRole: 'CITIZEN' | 'LIAR';
  yourWord?: string;
  accusedPlayer?: number;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string;
  subjects: string[];
  turnOrder?: string[];
  currentTurnIndex: number;
  phaseEndTime?: string;
  winner?: string;
  reason?: string;
  targetPoints: number;
  scoreboard: ScoreboardEntry[];
  finalVotingRecord?: FinalVoteRecord[] | null;
}

export interface BackendPlayer {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  state: PlayerState;
  hint?: string;
  defense?: string;
  votesReceived: number;
  hasVoted: boolean;
}

export interface ScoreboardEntry {
  userId: number;
  nickname: string;
  isAlive: boolean;
  score: number;
}

export interface FinalVoteRecord {
  gameNumber: number;
  voterPlayerId: number;
  voterNickname: string;
  voteForExecution: boolean;
  success: boolean;
  message?: string | null;
}

// Ready System Types
export interface PlayerReadyResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  playerId: number;
  nickname: string;
  isReady: boolean;
  allPlayersReady: boolean;
  readyCount: number;
  totalPlayers: number;
}

// Countdown System Types
export interface CountdownResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  countdownEndTime?: string;
  durationSeconds: number;
  canCancel: boolean;
}

// Connection Management Types
export interface PlayerConnectionStatus {
  userId: number;
  nickname: string;
  isConnected: boolean;
  hasGracePeriod: boolean;
  lastSeenAt: string;
  connectionStability: ConnectionStability;
}

export interface ConnectionStatusResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  players: PlayerConnectionStatus[];
}

// Voting System Types
export interface VotingStatusResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  currentVotes: number;
  requiredVotes: number;
  totalPlayers: number;
  votedPlayers: Array<{
    userId: number;
    nickname: string;
    votedAt?: string;
  }>;
  pendingPlayers: Array<{
    userId: number;
    nickname: string;
    votedAt?: string;
  }>;
  votingDeadline?: string;
  canChangeVote: boolean;
}

// Game Action Responses
export interface CastVoteResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  voterUserId: number;
  targetUserId: number;
  isSuccessful: boolean;
  message: string;
}

export interface DefenseSubmissionResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  playerId: number;
  playerNickname: string;
  defenseText: string;
  success: boolean;
}

export interface WordGuessResponse {
  schemaVersion?: typeof GAME_FLOW_SCHEMA_VERSION;
  gameNumber: number;
  guess: string;
  isCorrect: boolean;
  actualWord: string;
  success: boolean;
}

// WebSocket Event Types
export type RealtimeEventType = 
  | 'PLAYER_READY_CHANGED'
  | 'COUNTDOWN_STARTED'
  | 'COUNTDOWN_CANCELLED'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED'
  | 'GRACE_PERIOD_STARTED'
  | 'GRACE_PERIOD_EXPIRED'
  | 'VOTING_PROGRESS'
  | 'MAJORITY_REACHED'
  | 'PLAYER_VOTED'
  | 'DEFENSE_START'
  | 'FINAL_VOTING_RESULT'
  | 'GAME_END';

export interface RealtimeEvent {
  schemaVersion?: typeof REALTIME_SCHEMA_VERSION;
  type: RealtimeEventType;
  gameNumber: number;
  timestamp: string;
  [key: string]: unknown; // Additional event-specific data
}

// Chat System Types
export interface ChatHistoryRequest {
  gameNumber: number;
  page: number;
  size: number;
}

export interface ChatMessage {
  id: number;
  gameNumber: number;
  playerNickname: string;
  content: string;
  timestamp: string;
  type: ChatMessageType;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}