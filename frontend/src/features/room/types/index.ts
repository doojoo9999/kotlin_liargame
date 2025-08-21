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
}
