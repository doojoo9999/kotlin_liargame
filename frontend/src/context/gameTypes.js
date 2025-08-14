// Game state type definitions
export const GameStateTypes = {
  CURRENT_USER: 'currentUser',
  IS_AUTHENTICATED: 'isAuthenticated',
  CURRENT_ROOM: 'currentRoom',
  ROOM_LIST: 'roomList',
  SUBJECTS: 'subjects',
  SOCKET_CONNECTED: 'socketConnected',
  CHAT_MESSAGES: 'chatMessages',
  ROOM_PLAYERS: 'roomPlayers',
  CURRENT_TURN_PLAYER_ID: 'currentTurnPlayerId',
  GAME_STATUS: 'gameStatus',
  CURRENT_ROUND: 'currentRound',
  PLAYER_ROLE: 'playerRole',
  ASSIGNED_WORD: 'assignedWord',
  GAME_TIMER: 'gameTimer',
  VOTING_RESULTS: 'votingResults',
  VOTING_DATA: 'votingData',
  VOTING_PROGRESS: 'votingProgress',
  MY_VOTE: 'myVote',
  GAME_RESULTS: 'gameResults',
  ACCUSED_PLAYER_ID: 'accusedPlayerId',
  DEFENDING_PLAYER_ID: 'defendingPlayerId',
  DEFENSE_TEXT: 'defenseText',
  SURVIVAL_VOTING_PROGRESS: 'survivalVotingProgress',
  MY_SURVIVAL_VOTE: 'mySurvivalVote',
  WORD_GUESS_RESULT: 'wordGuessResult',
  FINAL_GAME_RESULT: 'finalGameResult',
  MODERATOR_MESSAGE: 'moderatorMessage',
  LOADING: 'loading',
  ERROR: 'error',
  CURRENT_PAGE: 'currentPage'
}

// Player role type definitions
export const PlayerRoleTypes = {
  LIAR: 'LIAR',
  CITIZEN: 'CITIZEN'
}

// Game status type definitions
export const GameStatusTypes = {
  WAITING: 'WAITING',
  SPEAKING: 'SPEAKING',
  VOTING: 'VOTING',
  DEFENSE: 'DEFENSE',
  SURVIVAL_VOTING: 'SURVIVAL_VOTING',
  WORD_GUESS: 'WORD_GUESS',
  RESULTS: 'RESULTS',
  FINISHED: 'FINISHED'
}

// Page type definitions
export const PageTypes = {
  LOBBY: 'lobby',
  ROOM: 'room'
}

// WebSocket event type definitions
export const WebSocketEventTypes = {
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  GAME_UPDATE: 'GAME_UPDATE',
  PLAYER_UPDATE: 'PLAYER_UPDATE',
  MODERATOR_MESSAGE: 'MODERATOR_MESSAGE',
  TURN_CHANGE: 'TURN_CHANGE'
}

// Room state type definitions
export const RoomStateTypes = {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
}

// Loading operation type definitions
export const LoadingOperationTypes = {
  ROOMS: 'rooms',
  ROOM: 'room',
  AUTH: 'auth',
  SUBJECTS: 'subjects',
  SOCKET: 'socket',
  CHAT_HISTORY: 'chatHistory'
}

// Error operation type definitions
export const ErrorOperationTypes = {
  ROOMS: 'rooms',
  ROOM: 'room',
  AUTH: 'auth',
  SUBJECTS: 'subjects',
  SOCKET: 'socket'
}

// Game action type definitions
export const GameActionTypes = {
  START: 'start',
  VOTE: 'vote',
  HINT: 'hint',
  DEFENSE: 'defense',
  SURVIVAL_VOTE: 'survival-vote',
  WORD_GUESS: 'word-guess',
  COMPLETE_SPEECH: 'complete-speech'
}

// Game winner type definitions
export const GameWinnerTypes = {
  LIAR: 'LIAR',
  CITIZEN: 'CITIZEN'
}

// User data structure type definition
export const createUserData = (id, nickname) => ({
  id,
  nickname
})

// Room data structure type definition
export const createRoomData = ({
  gameNumber,
  title,
  host,
  currentPlayers = 0,
  maxPlayers,
  hasPassword = false,
  subject = null,
  subjects = [],
  state = RoomStateTypes.WAITING,
  players = [],
  password = null,
  rounds = 1
}) => ({
  gameNumber,
  title,
  host,
  currentPlayers,
  maxPlayers,
  hasPassword,
  subject,
  subjects,
  state,
  players,
  password,
  rounds
})

// Player data structure type definition
export const createPlayerData = ({
  id,
  nickname,
  isHost = false,
  isAlive = true,
  avatar = null,
  avatarUrl = null
}) => ({
  id,
  nickname,
  isHost,
  isAlive,
  avatar,
  avatarUrl
})

// Chat message structure type definition
export const createChatMessage = ({
  id,
  playerNickname,
  content,
  timestamp
}) => ({
  id,
  playerNickname,
  content,
  timestamp
})

// Subject data structure type definition
export const createSubjectData = ({
  id,
  name,
  words = []
}) => ({
  id,
  name,
  words
})

// Voting progress structure type definition
export const createVotingProgress = ({
  voted = 0,
  total = 0
}) => ({
  voted,
  total
})

// Survival voting progress structure type definition
export const createSurvivalVotingProgress = ({
  spare = 0,
  eliminate = 0,
  total = 0
}) => ({
  spare,
  eliminate,
  total
})

// Word guess result structure type definition
export const createWordGuessResult = ({
  correct,
  guessedWord,
  actualWord
}) => ({
  correct,
  guessedWord,
  actualWord
})

// Final game result structure type definition
export const createFinalGameResult = ({
  winner,
  message
}) => ({
  winner,
  message
})