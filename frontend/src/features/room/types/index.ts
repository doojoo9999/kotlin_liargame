export interface LobbyUpdatePayload {
  type: 'ROOM_CREATED' | 'ROOM_UPDATED' | 'ROOM_DELETED';
  gameRoom: GameRoom;
}

export interface GameRoom {
  gameNumber: number;
  title: string;
  host: string;
  maxPlayers: number;
  currentPlayers: number;
  hasPassword: boolean;
  subject: string | null;
  subjects: string[];
  state: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  players: Player[];
}

export interface Player {
  id: number;
  userId: number;  // User 테이블 ID 참조 (비즈니스 로직용)
  nickname: string;
  isOwner: boolean;
  isReady: boolean;
  role?: 'LIAR' | 'CITIZEN';
  isEliminated: boolean;
  hasVoted: boolean;
}

export interface ScoreboardEntry {
  userId: number;
  nickname: string;
  role: string;
  isAlive: boolean;
  score: number;
}

export interface GameStateResponse {
  gameNumber: number;
  gameName: string;
  gameOwner: string;
  gameParticipants: number;
  gameCurrentRound: number;
  gameTotalRounds: number;
  gameLiarCount: number;
  gameMode: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD'; // 백엔드와 일치하도록 수정
  gameState: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  players: Player[];
  currentPhase: 'WAITING_FOR_PLAYERS' | 'SPEECH' | 'VOTING_FOR_LIAR' | 'DEFENDING' | 'VOTING_FOR_SURVIVAL' | 'GUESSING_WORD' | 'GAME_OVER'; // 백엔드와 일치하도록 수정
  yourRole?: 'LIAR' | 'CITIZEN';
  yourWord?: string;
  accusedPlayer?: Player;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string;
  subjects?: string[];
  turnOrder?: string[];
  currentTurnIndex?: number;
  phaseEndTime?: string;
  winner?: string; // 백엔드 구조에 맞게 수정
  reason?: string;
  targetPoints: number;
  scoreboard: ScoreboardEntry[];
  finalVotingRecord?: Record<string, unknown>[];
}