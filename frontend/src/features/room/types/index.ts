export interface GameRoom {
  gameNumber: number;
  title: string;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  status: 'WAITING' | 'IN_PROGRESS';
}

export interface Player {
  id: number;
  nickname: string;
  isOwner: boolean;
  isReady: boolean;
  role?: 'LIAR' | 'CITIZEN';
  isEliminated: boolean;
  hasVoted?: boolean;
}

export interface GameStateResponse {
  gameNumber: number;
  gameName: string;
  gameOwner: string;
  gameParticipants: number;
  gameCurrentRound: number;
  gameTotalRounds: number;
  gameLiarCount: number;
  gameMode: 'LIARS_KNOW' | 'CITIZENS_KNOW';
  gameState: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  players: Player[];
  currentPhase: 'WAITING' | 'SPEECH' | 'VOTE' | 'DEFENSE' | 'FINAL_VOTE' | 'LIAR_GUESS' | 'ENDED';
  yourRole?: 'LIAR' | 'CITIZEN';
  yourWord?: string;
  accusedPlayer?: Player;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string;
  subjects?: string[];
  // Suggested fields for turn management
  turnOrder?: string[]; // Array of nicknames in order of play
  currentTurnIndex?: number; // Index for the turnOrder array
  phaseEndTime?: string; // ISO 8601 string for when the current phase ends
  // Fields for game results
  winner?: 'CITIZEN' | 'LIAR';
  reason?: string;
}
