// 힌트 제출 응답
export interface HintSubmissionResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  currentTurnIndex: number;
  currentPlayerId: number;
  success: boolean;
}

// 투표 응답
export interface VoteResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  votedPlayer: {
    id: number;
    nickname: string;
    voteCount: number;
  };
  success: boolean;
}

// 변론 응답
export interface DefenseResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  defenseText: string;
  remainingTime: number;
  success: boolean;
}

// 최종 투표 응답
export interface FinalVoteResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  accusedPlayer: {
    id: number;
    nickname: string;
    isExecuted: boolean;
  };
  success: boolean;
}

// 단어 추측 응답
export interface GuessResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  guess: string;
  isCorrect: boolean;
  success: boolean;
}

// 게임 결과
export interface GameResult {
  gameNumber: number;
  winningTeam: 'CITIZENS' | 'LIARS';
  players: {
    id: number;
    nickname: string;
    role: 'CITIZEN' | 'LIAR';
    isAlive: boolean;
    isWinner: boolean;
    score: number;
  }[];
  gameStatistics: {
    totalRounds: number;
    currentRound: number;
    totalDuration: number;
    averageRoundDuration: number;
  };
  reason: string;
}

// 라운드 종료 응답
export interface RoundEndResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  gameCurrentRound: number;
  scoreboard: {
    userId: number;
    nickname: string;
    isAlive: boolean;
    score: number;
  }[];
  success: boolean;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  gameNumber: number;
  userId: number;
  nickname: string;
  message: string;
  timestamp: number;
  type: 'GENERAL' | 'SYSTEM' | 'HINT' | 'DEFENSE';
}
