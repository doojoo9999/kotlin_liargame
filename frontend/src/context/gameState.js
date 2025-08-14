import {ERROR_KEYS, GAME_STATUS, LOADING_KEYS, PAGES} from './gameConstants'

// Initial state for game context
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

  gameStatus: GAME_STATUS.WAITING, // 'WAITING' | 'SPEAKING' | 'VOTING' | 'RESULTS' | 'FINISHED'
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
    [LOADING_KEYS.ROOMS]: false,
    [LOADING_KEYS.ROOM]: false,
    [LOADING_KEYS.AUTH]: false,
    [LOADING_KEYS.SUBJECTS]: false,
    [LOADING_KEYS.SOCKET]: false,
    [LOADING_KEYS.CHAT_HISTORY]: false
  },
  error: {
    [ERROR_KEYS.ROOMS]: null,
    [ERROR_KEYS.ROOM]: null,
    [ERROR_KEYS.AUTH]: null,
    [ERROR_KEYS.SUBJECTS]: null,
    [ERROR_KEYS.SOCKET]: null
  },
  
  // App state
  currentPage: PAGES.LOBBY // 'lobby' | 'room'
}