// 게임 상태 타입
export type GameState = 'WAITING' | 'IN_PROGRESS' | 'ENDED';

// 게임 단계 타입
export type GamePhase =
  | 'WAITING_FOR_PLAYERS'
  | 'SPEECH'
  | 'VOTING_FOR_LIAR'
  | 'DEFENDING'
  | 'VOTING_FOR_SURVIVAL'
  | 'GUESSING_WORD'
  | 'GAME_OVER';

// 플레이어 상태 타입
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

// 플레이어 역할 타입
export type PlayerRole = 'CITIZEN' | 'LIAR';

// 게임 모드 타입
export type GameMode = 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';

// 채팅 메시지 타입
export type ChatMessageType = 'HINT' | 'DISCUSSION' | 'DEFENSE' | 'POST_ROUND' | 'SYSTEM';

// 플레이어 인터페이스
export interface Player {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  role?: PlayerRole;
  state: PlayerState;
  assignedWord?: string;
  hint?: string;
  defense?: string;
  votedFor?: number;
  votesReceived: number;
  hasVoted: boolean;
  cumulativeScore: number;
  joinedAt: string;
  isCurrentTurn?: boolean;
}

// 게임 정보 인터페이스
export interface GameInfo {
  gameNumber: number;
  gameName?: string;
  gameOwner: string;
  gameState: GameState;
  currentPhase: GamePhase;
  players: Player[];
  gameMode: GameMode;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameCurrentRound: number;
  yourRole?: PlayerRole;
  yourWord?: string;
  accusedPlayer?: Player;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string;
  subjects: string[];
  turnOrder: string[];
  currentTurnIndex: number;
  phaseEndTime?: string;
  winner?: string;
  reason?: string;
  targetPoints: number;
  scoreboard: ScoreboardEntry[];
  finalVotingRecord?: any;
}

// 점수판 엔트리 인터페이스
export interface ScoreboardEntry {
  userId: number;
  nickname: string;
  isAlive: boolean;
  score: number;
}

// 채팅 메시지 인터페이스
export interface ChatMessage {
  id: number;
  gameNumber: number;
  playerNickname: string | null;
  content: string;
  type: ChatMessageType;
  timestamp: string;
}

// 게임 룸 정보 인터페이스
export interface GameRoom {
  gameNumber: number;
  gameOwner: string;
  gameState: GameState;
  gameParticipants: number;
  currentPlayerCount: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameMode: GameMode;
  createdAt: string;
  subjects: string[];
}

// 주제 인터페이스
export interface Subject {
  id: number;
  content: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  wordCount: number;
  words: string[];
}

// 단어 인터페이스
export interface Word {
  id: number;
  content: string;
  subjectId: number;
  subjectContent: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}
