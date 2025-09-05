// 게임 관련 핵심 타입 정의
export type GamePhase =
  | 'WAITING'
  | 'ROLE_ASSIGNMENT'
  | 'HINT_PROVIDING'
  | 'DISCUSSION'
  | 'VOTING'
  | 'DEFENSE'
  | 'FINAL_VOTING'
  | 'RESULT'
  | 'FINISHED';

export type PlayerRole = 'CITIZEN' | 'LIAR';

export type PlayerState =
  | 'ACTIVE'
  | 'ELIMINATED'
  | 'SUSPECTED'
  | 'DEFENDING'
  | 'DISCONNECTED';

export type GameStatus =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';

export interface GameRoom {
  id: number;
  title: string;
  hostUserId: number;
  hostNickname: string;
  currentPlayerCount: number;
  maxPlayerCount: number;
  isPrivate: boolean;
  password?: string;
  status: GameStatus;
  createdAt: string;
  gameSettings: GameSettings;
}

export interface GameSettings {
  maxPlayerCount: number;
  timePerPhase: number;
  enableChat: boolean;
  enableHints: boolean;
  subjectCategory?: string;
  customSubjects?: string[];
}

export interface Player {
  id: number;
  userId: number;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  role?: PlayerRole;
  state: PlayerState;
  joinedAt: string;
  // 게임 진행 상태
  hint?: string;
  votesReceived: number;
  hasVoted: boolean;
  hasProvidedHint: boolean;
}

export interface GameState {
  gameNumber: number;
  roomId: number;
  gamePhase: GamePhase;
  currentTurnIndex: number;
  currentPlayerId?: number;
  timeRemaining?: number;
  totalTime?: number;
  round: number;
  maxRounds: number;
  subject?: Subject;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  keyword: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  createdAt: string;
}

export interface VotingRecord {
  id: number;
  gameNumber: number;
  voterId: number;
  targetId: number;
  voteType?: boolean; // For FINAL_SURVIVAL voting (true = 찬성, false = 반대)
  gamePhase: GamePhase;
  timestamp: string;
}

export interface GameResult {
  gameNumber: number;
  winningTeam: PlayerRole;
  liarId: number;
  isLiarFound: boolean;
  gameEndReason: 'LIAR_FOUND' | 'LIAR_SURVIVED' | 'TIMEOUT' | 'DISCONNECT';
  finalPlayers: Player[];
  totalDuration: number;
  createdAt: string;
}

// API 요청/응답 타입
export interface CreateGameRoomRequest {
  title: string;
  maxPlayerCount: number;
  isPrivate: boolean;
  password?: string;
  gameSettings: GameSettings;
}

export interface JoinGameRoomRequest {
  password?: string;
}

export interface VoteRequest {
  targetId: number;
  voteType?: boolean;
}

export interface HintRequest {
  hint: string;
}

export interface PlayerAction {
  type: 'VOTE' | 'HINT' | 'DEFEND' | 'SKIP' | 'CHAT';
  playerId: number;
  targetId?: number;
  data?: any;
  timestamp: string;
}
