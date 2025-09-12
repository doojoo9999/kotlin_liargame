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
  nickname: string;
  isOwner: boolean;
  isReady: boolean;
  role?: 'LIAR' | 'CITIZEN';
  isEliminated: boolean;
  hasVoted: boolean;
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
  turnOrder?: string[];
  currentTurnIndex?: number;
  phaseEndTime?: string;
  winner?: 'CITIZEN' | 'LIAR';
  reason?: string;
}