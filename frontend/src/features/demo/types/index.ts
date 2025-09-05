export interface Player {
  readonly id: string;
  name: string;
  role: PlayerRole;
  status: PlayerStatus;
  isAlive: boolean;
  hasVoted: boolean;
  votesReceived: number;
  isHost?: boolean;
  lastActivity?: Date;
  avatar?: string;
  connectionQuality?: 'good' | 'fair' | 'poor';
}

export type PlayerRole = 'citizen' | 'liar' | 'unknown';
export type PlayerStatus = 'online' | 'away' | 'offline';
export type GamePhase = 'lobby' | 'discussion' | 'voting' | 'defense' | 'result';

export interface GameState {
  readonly phase: GamePhase;
  timeLeft: number;
  readonly round: number;
  readonly topic: string;
  readonly maxTime: number;
  isLoading?: boolean;
  error?: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly author: string;
  readonly content: string;
  readonly timestamp: Date;
  readonly type: MessageType;
  readonly metadata?: MessageMetadata;
  reactions?: Reaction[];
}

export type MessageType = 'user' | 'system' | 'action';

export interface MessageMetadata {
  targetPlayer?: string;
  action?: 'vote' | 'defend' | 'accuse';
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface GameEvents {
  'player:vote': { playerId: string; targetId: string };
  'player:defend': { playerId: string; message: string };
  'game:phase-change': { newPhase: GamePhase; duration: number };
  'timer:update': { timeLeft: number; phase: GamePhase };
  'player:join': { player: Player };
  'player:leave': { playerId: string };
  'chat:message': { message: ChatMessage };
}

export type GameEventHandler<T extends keyof GameEvents> = (data: GameEvents[T]) => void;

export interface TooltipContent {
  title: string;
  description: string;
  shortcut?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface GameStats {
  aliveCount: number;
  votedCount: number;
  totalCount: number;
  hostCount: number;
  connectionIssues: number;
}

export interface Theme {
  name: 'dark' | 'light';
  colors: {
    background: string;
    cardBg: string;
    cardHover: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: {
      primary: string;
      success: string;
      danger: string;
      warning: string;
      purple: string;
      cyan: string;
    };
    online: string;
    away: string;
    offline: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}