// 게임 관련 타입 정의
export interface Player {
  id: string;
  nickname: string;
  isAlive: boolean;
  hasVoted: boolean;
  hint?: string;
  role?: 'citizen' | 'liar';
  avatar?: string;
  lastActivity?: Date;
}

export interface GameState {
  phase: 'waiting' | 'playing' | 'voting' | 'ended';
  currentPlayerId?: string;
  round: number;
  topic?: string;
  timeRemaining?: number;
  votingResults?: VotingResult[];
  winner?: 'citizens' | 'liar' | 'draw';
}

export interface VotingResult {
  playerId: string;
  votes: number;
  voters: string[];
}

export interface GameEvent {
  type: 'player_joined' | 'player_left' | 'turn_changed' | 'vote_cast' |
        'phase_changed' | 'game_ended' | 'hint_submitted' | 'player_eliminated' |
        'liar_revealed';
  data: any;
  timestamp: Date;
}

// UI 관련 타입
export interface PlayerAction {
  type: 'select' | 'vote' | 'context' | 'hint';
  playerId: string;
  data?: any;
}

export interface InteractionEvent {
  type: string;
  element: HTMLElement;
  data?: any;
}

// 성능 모니터링 타입
export interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
  loadTime: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
}

// 접근성 관련 타입
export interface AccessibilityConfig {
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  keyboardNavigation: boolean;
}

// 제스처 관련 타입
export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress';
  direction?: 'up' | 'down' | 'left' | 'right';
  data: {
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    duration: number;
    velocity?: number;
  };
}

// 애니메이션 관련 타입
export interface AnimationConfig {
  duration: number;
  easing: string;
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  delay?: number;
  iterations?: number;
}

export interface AnimationPreset {
  [key: string]: AnimationConfig;
}

// 적응형 UI 타입
export interface DeviceInfo {
  screenSize: 'mobile' | 'tablet' | 'desktop';
  deviceCapability: 'low' | 'medium' | 'high';
  networkSpeed: 'slow' | 'fast';
  orientation: 'portrait' | 'landscape';
}

export interface LayoutConfig {
  playerCard: {
    size: 'compact' | 'full';
    columns: number;
    spacing: 'tight' | 'comfortable';
    orientation: 'vertical' | 'horizontal';
  };
  gameBoard: {
    layout: 'stack' | 'grid';
    orientation: 'portrait' | 'landscape';
    padding: string;
  };
  chat: {
    position: 'bottom' | 'side';
    height: string;
    width: string;
  };
  navigation: {
    type: 'top' | 'bottom';
    collapsible: boolean;
  };
}

// 이벤트 핸들러 타입
export type PlayerSelectHandler = (player: Player) => void;
export type PlayerVoteHandler = (player: Player) => void;
export type PlayerActionHandler = (playerId: string, action: string) => void;
export type GameEventHandler = (event: GameEvent) => void;

// 컴포넌트 Props 타입
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

export interface GameComponentProps extends BaseComponentProps {
  players: Player[];
  gameState: GameState;
  onPlayerSelect?: PlayerSelectHandler;
  onPlayerVote?: PlayerVoteHandler;
  onPlayerAction?: PlayerActionHandler;
}

// 유틸리티 타입
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 상태 관리 타입
export interface AppState {
  game: GameState;
  players: Player[];
  ui: {
    selectedPlayerId: string | null;
    activeModal: string | null;
    notifications: Notification[];
  };
  settings: {
    accessibility: AccessibilityConfig;
    performance: {
      enableVirtualization: boolean;
      enableAnimations: boolean;
      enableHaptics: boolean;
    };
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}
