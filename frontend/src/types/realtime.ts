// 백엔드 신규/강화 API에 맞춘 타입들

export interface PlayerReadyResponse {
  playerId: number
  nickname: string
  isReady: boolean
  isOwner: boolean
}

export interface HostPermissions {
  canStartGame: boolean
  canKickPlayers: boolean
  canTransferHost: boolean
  canModifySettings: boolean
}

export interface HostTransferRequest {
  targetPlayerId: number
  targetNickname: string
}

export interface CountdownResponse {
  isActive: boolean
  startedAt?: string // ISO timestamp
  endTime?: string // ISO timestamp
  durationSeconds: number
  remainingSeconds?: number
}

export type ConnectionStateType = 'CONNECTED' | 'DISCONNECTED' | 'GRACE_PERIOD'

export interface PlayerConnectionStatus {
  playerId: number
  nickname: string
  connectionState: ConnectionStateType
  lastConnectedAt?: string
  gracePeriodEndsAt?: string
}

export interface ConnectionStatusResponse {
  connectedCount: number
  disconnectedCount: number
  totalCount: number
  playerStatuses: PlayerConnectionStatus[]
}

export type VotingPhase = 'LIAR_ELIMINATION' | 'SURVIVAL_VOTE' | 'TIE_BREAKER' | 'ACCUSATION' | 'DEFENSE' | 'COMPLETED'

export interface PlayerVoteInfo {
  playerId: number
  nickname: string
  targetPlayerId?: number
  targetNickname?: string
  hasVoted: boolean
}

export interface VotingStatusResponse {
  votingPhase: VotingPhase
  requiredVotes: number
  currentVotes: number
  activePlayersCount: number
  playerVotes: PlayerVoteInfo[]
}

export type BroadcastMessageType =
  | 'PLAYER_READY_UPDATE'
  | 'COUNTDOWN_STARTED'
  | 'COUNTDOWN_CANCELLED'
  | 'CONNECTION_STATUS_UPDATE'
  | 'VOTING_PROGRESS'
  | 'PLAYER_RECONNECTED'
  | 'GAME_STATE_UPDATE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'

export interface WebSocketMessage<T = any> {
  type: BroadcastMessageType
  payload: T
  gameNumber: number
  timestamp: string
}

export interface PlayerReadyUpdatePayload {
  playerId: number
  nickname: string
  isReady: boolean
}

export interface CountdownPayload {
  isActive: boolean
  startedAt?: string
  endTime?: string
  durationSeconds: number
}

export interface VotingProgressPayload {
  votingPhase: VotingPhase
  requiredVotes: number
  currentVotes: number
  activePlayersCount: number
}

export type WinningTeam = 'LIARS' | 'CITIZENS' | 'DRAW'

export interface PlayerResultInfo {
  userId: number
  nickname: string
  role: string
  points: number
  isAlive: boolean
}

export interface GameStatistics {
  totalRounds: number
  completedRounds: number
  totalVotes: number
  averageVotingTime: number
}

export interface GameEndResponse {
  gameNumber: number
  winner: WinningTeam
  citizens: PlayerResultInfo[]
  liars: PlayerResultInfo[]
  citizenSubject?: string
  liarSubject?: string
  gameStatistics: GameStatistics
  timestamp: string
}

export type GameEndCondition = 'LIAR_VICTORY' | 'CITIZEN_VICTORY' | 'NEXT_ROUND'

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  gameId?: string;
  userId?: string;
}

export interface GameEvent {
  type: 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'GAME_STARTED' | 'ROUND_STARTED' |
        'HINT_PROVIDED' | 'VOTE_CAST' | 'DEFENSE_SUBMITTED' | 'ROUND_ENDED' |
        'GAME_ENDED' | 'CHAT_MESSAGE' | 'GAME_STATE_UPDATED';
  gameId: string;
  payload: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'CHAT' | 'SYSTEM';
}

export interface PlayerJoinedEvent {
  playerId: string;
  playerName: string;
  isHost: boolean;
}

export interface PlayerLeftEvent {
  playerId: string;
  playerName: string;
}

export interface GameStartedEvent {
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
  }>;
  currentRound: number;
  totalRounds: number;
}

export interface RoundStartedEvent {
  roundNumber: number;
  category: string;
  timeLimit: number;
  liarId: string; // Only sent to the liar
}

export interface HintProvidedEvent {
  playerId: string;
  playerName: string;
  hint: string;
  roundNumber: number;
}

export interface VoteCastEvent {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
}

export interface DefenseSubmittedEvent {
  defenderId: string;
  defenderName: string;
  defense: string;
}

export interface RoundEndedEvent {
  roundNumber: number;
  liarId: string;
  liarName: string;
  liarCaught: boolean;
  votes: Array<{
    voterId: string;
    voterName: string;
    targetId: string;
    targetName: string;
  }>;
  scores: Array<{
    playerId: string;
    playerName: string;
    score: number;
  }>;
}

export interface GameEndedEvent {
  winner: {
    id: string;
    name: string;
    score: number;
  };
  finalScores: Array<{
    playerId: string;
    playerName: string;
    score: number;
  }>;
  gameStats: {
    totalRounds: number;
    liarsWon: number;
    detectivesWon: number;
  };
}

export interface GameStateUpdatedEvent {
  state: 'WAITING' | 'STARTING' | 'PROVIDING_HINTS' | 'VOTING' | 'DEFENDING' | 'ROUND_ENDED' | 'GAME_ENDED';
  currentRound?: number;
  timeRemaining?: number;
  currentPhase?: string;
}

export type EventCallback = (event: GameEvent) => void;
export type ChatCallback = (message: ChatMessage) => void;
export type ConnectionCallback = (connected: boolean) => void;

export interface WebSocketServiceInterface {
  readonly connected: boolean;
  readonly currentGame: string | null;

  connect(): Promise<void>;

  disconnect(): void;

  subscribeToGame(gameId: string): void;

  unsubscribeFromGame(gameId: string): void;

  onGameEvent(eventType: string, callback: EventCallback): () => void;

  onChatMessage(callback: ChatCallback): () => void;

  addConnectionCallback(callback: ConnectionCallback): void;

  removeConnectionCallback(callback: ConnectionCallback): void;

  sendChatMessage(gameId: string, message: string): void;

  sendGameAction(gameId: string, action: string, payload?: any): void;

  castVote(gameId: string, targetPlayerId: string): void;

  submitDefense(gameId: string, defense: string): void;

  startGame(gameId: string): void;
}
