export interface GameCreateRequest {
  gameParticipants: number;        // 참여자 수
  gameLiarCount: number;           // 라이어 수
  gameTotalRounds: number;         // 총 라운드 수
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD";
  subjectIds: number[];            // 주제 ID 배열
  useRandomSubjects: boolean;      // 랜덤 주제 사용 여부
  randomSubjectCount: number;      // 랜덤 주제 개수
  targetPoints: number;            // 목표 점수 (1-50)
}

export type GameCreateResponse = number;

export interface GameJoinRequest {
  gameNumber: number;
}

export interface GameJoinResponse {
  gameNumber: number;
  gameState: "WAITING" | "IN_PROGRESS" | "ENDED";
  currentPhase: GamePhase;
  players: Player[];
  gameMode: string;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameCurrentRound: number;
}

export interface VoteRequest {
  gameNumber: number;
  targetUserId: number;  // ⚠️ targetPlayerId 아님!
}

export interface VoteResponse {
  gameNumber: number;
  voterUserId: number;
  targetUserId: number;
  isSuccessful: boolean;
  message: string;
}

export type ChatMessageType = "HINT" | "DISCUSSION" | "DEFENSE" | "POST_ROUND" | "SYSTEM";

export interface ChatSendRequest {
  gameNumber: number;
  content: string;
  type: ChatMessageType;
}

export interface ChatMessage {
  id: number;
  gameNumber: number;
  playerNickname: string;
  content: string;
  timestamp: string;
  type: ChatMessageType;
}

export interface ChatHistoryRequest {
  gameNumber: number;
  page: number;
  size: number;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface HintRequest {
  gameNumber: number;
  hint: string;
}

export interface HintResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  currentTurnIndex: number;
  currentPlayerId: number;
}

export interface DefenseRequest {
  gameNumber: number;
  defenseText: string;
}

export interface DefenseResponse {
  gameNumber: number;
  playerId: number;
  playerNickname: string;
  defenseText: string;
  success: boolean;
}

export interface FinalVoteRequest {
  gameNumber: number;
  voteForExecution: boolean; // true: 처형, false: 생존
}

export interface FinalVoteResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
}

export interface LiarGuessRequest {
  gameNumber: number;
  guess: string;
}

export interface LiarGuessResponse {
  gameNumber: number;
  guess: string;
  isCorrect: boolean;
  actualWord: string;
  success: boolean;
}

export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  userId?: number;
  nickname?: string;
}

export interface RefreshSessionRequest {
  // 빈 body
}

export interface RefreshSessionResponse {
  success: boolean;
  userId?: number;
  nickname?: string;
  message?: string; // 실패 시
}

export type GamePhase =
  | 'WAITING'
  | 'ROLE_ASSIGNMENT'
  | 'HINT_PROVIDING'
  | 'DISCUSSION'
  | 'VOTING'
  | 'DEFENSE'
  | 'FINAL_VOTING'
  | 'LIAR_GUESS'
  | 'RESULT'
  | 'FINISHED';

export type PlayerRole = 'CITIZEN' | 'LIAR';

export interface Player {
  id: number;
  userId: number;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  role?: PlayerRole;
  joinedAt: string;
  hint?: string;
  votesReceived: number;
  hasVoted: boolean;
  hasProvidedHint: boolean;
  votedFor?: number;
}
