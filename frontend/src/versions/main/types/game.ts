// Game Types for Main Version
export interface Player {
  id: number;
  nickname: string;
  role?: 'CITIZEN' | 'LIAR' | 'UNKNOWN';
  isHost: boolean;
  isAlive: boolean;
  votesReceived: number;
  hasVoted?: boolean;
  isCurrentPlayer?: boolean;
  isReady?: boolean;
  votedBy?: number;
  // 추가 속성들
  userId?: number;
  state?: string;
  hint?: string;
  defense?: string;
  cumulativeScore?: number;
  joinedAt?: string;
  isCurrentTurn?: boolean;
}

export interface ChatMessage {
  id: number;
  player: string;
  message: string;
  timestamp: string;
  isOwn?: boolean;
  // 추가 속성들로 호환성 확보
  gameNumber?: number;
  playerNickname?: string;
  content?: string;
  type?: 'NORMAL' | 'SYSTEM' | 'HINT' | 'DEFENSE' | 'DISCUSSION' | 'POST_ROUND';
}

export type GamePhase = 'WAITING' | 'DISCUSSING' | 'VOTING' | 'REVEALING' | 'ENDED' |
  'WAITING_FOR_PLAYERS' | 'SPEECH' | 'VOTING_FOR_LIAR' | 'DEFENDING' | 'VOTING_FOR_SURVIVAL' | 'GUESSING_WORD' | 'GAME_OVER';

export type PlayerRole = 'CITIZEN' | 'LIAR' | 'UNKNOWN';

export type ChatMessageType = 'HINT' | 'DISCUSSION' | 'DEFENSE' | 'POST_ROUND' | 'SYSTEM' | 'NORMAL';

export interface GameRoom {
  id: number;
  name: string;
  hostId: number;
  players: Player[];
  gameSettings: GameSettings;
  status: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  currentRound: number;
  maxRounds: number;
  timeRemaining?: number;
}

export interface GameSettings {
  maxPlayers: number;
  liarCount: number;
  gameMode: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';
  targetPoints: number;
  useRandomSubjects: boolean;
  subjectIds?: number[];
  randomSubjectCount?: number;
}

export interface VotingRecord {
  voterId: number;
  targetId: number;
  confidence?: number;
  timestamp: number;
}

export interface GameResult {
  winner: 'CITIZENS' | 'LIARS';
  scores: Record<number, number>;
  roundResults: RoundResult[];
}

export interface RoundResult {
  round: number;
  eliminatedPlayer?: number;
  liarsFound: number[];
  citizensCorrect: boolean;
}
