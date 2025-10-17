export interface PuzzleSummary {
  id: number;
  code: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  width: number;
  height: number;
  estimatedMinutes: number;
}

export interface PuzzlePageResponse {
  items: PuzzleSummary[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface PuzzleDetail extends PuzzleSummary {
  description?: string | null;
  availableActions: string[];
}

export interface SessionResponse {
  sessionId: number;
  puzzleId: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  mistakes: number;
  hintsUsed: number;
  startedAt: string;
  completedAt?: string | null;
  finalScore?: number | null;
  durationSeconds?: number | null;
}

export interface SessionStartRequest {
  puzzleId: number;
  resume?: boolean;
}

export interface SessionActionRequest {
  actions: Array<{ x: number; y: number; state: 'FILLED' | 'EMPTY' | 'MARKED' }>;
  mistakeCount?: number;
  hintsUsed?: number;
  durationSeconds?: number;
}

export interface SessionCompletionRequest {
  finalScore: number;
  durationSeconds: number;
  mistakes: number;
  hintsUsed: number;
  accuracy?: number;
}

export interface SessionCompletionResponse {
  sessionId: number;
  score: number;
  pointsAwarded: number;
  rankEstimate?: number | null;
  completionTimeSeconds: number;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  rank: number;
  score: number;
  durationSeconds: number;
}

export interface LeaderboardResponse {
  releasePack: string;
  scope: 'GLOBAL' | 'FRIENDS';
  entries: LeaderboardEntry[];
}
