// 게임 관련 타입 정의
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

export type PlayerState =
  | 'ACTIVE'
  | 'ELIMINATED'
  | 'SUSPECTED'
  | 'DEFENDING';

export type ChatMessageType =
  | 'HINT'
  | 'DISCUSSION'
  | 'DEFENSE'
  | 'SYSTEM'
  | 'VOTE_ANNOUNCEMENT';

export interface Player {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  role?: 'CITIZEN' | 'LIAR';
  state: PlayerState;
  hint?: string;
  votesReceived: number;
  hasVoted: boolean;
  isHost?: boolean;
}

export interface GameState {
  gamePhase: GamePhase;
  currentTurnIndex: number;
  currentPlayerId?: number;
  timeRemaining?: number;
  totalTime?: number;
  round: number;
  maxRounds: number;
}

export interface VotingRecord {
  voterId: number;
  targetId: number;
  voteType?: boolean; // For FINAL_SURVIVAL voting
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderNickname: string;
  content: string;
  type: ChatMessageType;
  timestamp: Date;
  gamePhase: GamePhase;
}

export interface PlayerAction {
  type: 'VOTE' | 'HINT' | 'DEFEND' | 'SKIP';
  playerId: number;
  targetId?: number;
  data?: any;
}

// 애니메이션 관련 타입
export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
  repeat?: number;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface AnimationContext {
  gamePhase: GamePhase;
  playerCount: number;
  isCurrentPlayer: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  performanceLevel: 'low' | 'medium' | 'high';
  userPreferences: {
    reduceMotion: boolean;
    preferredSpeed: number;
  };
}
