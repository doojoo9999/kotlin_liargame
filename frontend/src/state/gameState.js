// Initial state for the game context
// This module contains only the initial state structure
export const initialState = {
  currentUser: null,
  isAuthenticated: false,

  currentRoom: null,
  roomList: [],
  subjects: [],

  socketConnected: false,
  chatMessages: [],
  roomPlayers: [],
  currentTurnPlayerId: null,

  gameStatus: 'WAITING', // 'WAITING' | 'SPEAKING' | 'VOTING' | 'RESULTS' | 'FINISHED'
  currentRound: 0,
  playerRole: null, // 'LIAR' | 'CITIZEN' | null
  assignedWord: null, // The word/keyword assigned to the player
  gameTimer: 0, // Remaining time for current phase
  votingResults: null,
  votingData: null,
  votingProgress: { voted: 0, total: 0 },
  myVote: null, // The player ID that current user voted for
  gameResults: null,
  accusedPlayerId: null,
  defendingPlayerId: null,
  defenseText: null,
  survivalVotingProgress: { spare: 0, eliminate: 0, total: 0 },
  mySurvivalVote: null, // true for spare, false for eliminate
  wordGuessResult: null, // { correct: boolean, guessedWord: string, actualWord: string }
  finalGameResult: null, // { winner: 'LIAR' | 'CITIZEN', message: string }
  moderatorMessage: null,
  
  // UI state
  loading: {
    rooms: false,
    room: false,
    auth: false,
    subjects: false,
    socket: false,
    chatHistory: false
  },
  error: {
    rooms: null,
    room: null,
    auth: null,
    subjects: null,
    socket: null
  },
  
  // App state
  currentPage: 'lobby' // 'lobby' | 'room'
}