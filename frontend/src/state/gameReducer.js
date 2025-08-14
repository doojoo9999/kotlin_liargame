import {ActionTypes} from './gameActions.js'

// Individual reducer case functions for better organization and testability
export const handleSetLoading = (state, action) => ({
  ...state,
  loading: {
    ...state.loading,
    [action.payload.type]: action.payload.value
  }
})

export const handleSetError = (state, action) => ({
  ...state,
  error: {
    ...state.error,
    [action.payload.type]: action.payload.value
  }
})

export const handleSetUser = (state, action) => ({
  ...state,
  currentUser: action.payload,
  isAuthenticated: !!action.payload
})

export const handleLogout = (state) => {
  localStorage.removeItem('userData')
  return {
    ...state,
    currentUser: null,
    isAuthenticated: false,
    currentRoom: null,
    currentPage: 'lobby'
  }
}

export const handleSetRoomList = (state, action) => ({
  ...state,
  roomList: action.payload
})

export const handleSetCurrentRoom = (state, action) => ({
  ...state,
  currentRoom: action.payload,
  currentPage: 'room'
})

export const handleClearCurrentRoom = (state) => ({
  ...state,
  currentRoom: null,
  currentPage: 'lobby'
})

export const handleUpdateRoomInList = (state, action) => ({
  ...state,
  roomList: state.roomList.map(room =>
    room.gameNumber === action.payload.gameNumber
      ? { ...room, ...action.payload }
      : room
  )
})

export const handleSetSubjects = (state, action) => ({
  ...state,
  subjects: action.payload
})

export const handleAddSubject = (state, action) => {
  // 중복 주제 검사: 이미 존재하는 ID를 가진 주제는 추가하지 않음
  const subjectExists = state.subjects.some(subject => subject.id === action.payload.id)
  if (subjectExists) {
    console.log('[DEBUG_LOG] Subject already exists in state, not adding duplicate:', action.payload)
    return state
  }
  return {
    ...state,
    subjects: [...state.subjects, action.payload]
  }
}

export const handleSetCurrentPage = (state, action) => ({
  ...state,
  currentPage: action.payload
})

export const handleSetModeratorMessage = (state, action) => ({
  ...state,
  moderatorMessage: action.payload
})

export const handleSetSocketConnection = (state, action) => ({
  ...state,
  socketConnected: action.payload
})

export const handleAddChatMessage = (state, action) => ({
  ...state,
  chatMessages: [...state.chatMessages, action.payload]
})

export const handleSetChatMessages = (state, action) => ({
  ...state,
  chatMessages: action.payload
})

export const handleClearChatMessages = (state) => ({
  ...state,
  chatMessages: []
})

export const handleSetRoomPlayers = (state, action) => ({
  ...state,
  roomPlayers: action.payload
})

export const handleUpdatePlayerInRoom = (state, action) => ({
  ...state,
  roomPlayers: state.roomPlayers.map(player =>
    player.id === action.payload.id
      ? { ...player, ...action.payload }
      : player
  )
})

export const handleSetCurrentTurnPlayer = (state, action) => ({
  ...state,
  currentTurnPlayerId: action.payload
})

export const handleSetGameStatus = (state, action) => ({
  ...state,
  gameStatus: action.payload
})

export const handleSetCurrentRound = (state, action) => ({
  ...state,
  currentRound: action.payload
})

export const handleSetPlayerRole = (state, action) => ({
  ...state,
  playerRole: action.payload
})

export const handleSetAssignedWord = (state, action) => ({
  ...state,
  assignedWord: action.payload
})

export const handleSetGameTimer = (state, action) => ({
  ...state,
  gameTimer: action.payload
})

export const handleSetVotingResults = (state, action) => ({
  ...state,
  votingResults: action.payload
})

export const handleSetVotingData = (state, action) => ({
  ...state,
  votingData: action.payload
})

export const handleSetVotingProgress = (state, action) => ({
  ...state,
  votingProgress: action.payload
})

export const handleSetMyVote = (state, action) => ({
  ...state,
  myVote: action.payload
})

export const handleSetGameResults = (state, action) => ({
  ...state,
  gameResults: action.payload
})

export const handleSetAccusedPlayer = (state, action) => ({
  ...state,
  accusedPlayerId: action.payload
})

export const handleSetDefendingPlayer = (state, action) => ({
  ...state,
  defendingPlayerId: action.payload
})

export const handleSetDefenseText = (state, action) => ({
  ...state,
  defenseText: action.payload
})

export const handleSetSurvivalVotingProgress = (state, action) => ({
  ...state,
  survivalVotingProgress: action.payload
})

export const handleSetMySurvivalVote = (state, action) => ({
  ...state,
  mySurvivalVote: action.payload
})

export const handleSetWordGuessResult = (state, action) => ({
  ...state,
  wordGuessResult: action.payload
})

export const handleSetFinalGameResult = (state, action) => ({
  ...state,
  finalGameResult: action.payload
})

export const handleResetGameState = (state) => ({
  ...state,
  gameStatus: 'WAITING',
  currentRound: 0,
  playerRole: null,
  assignedWord: null,
  gameTimer: 0,
  votingResults: null,
  gameResults: null,
  accusedPlayerId: null,
  defendingPlayerId: null,
  defenseText: null,
  survivalVotingProgress: { spare: 0, eliminate: 0, total: 0 },
  mySurvivalVote: null,
  wordGuessResult: null,
  finalGameResult: null
})

// Main reducer function using separated case handlers
export const gameReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return handleSetLoading(state, action)
    
    case ActionTypes.SET_ERROR:
      return handleSetError(state, action)
    
    case ActionTypes.SET_USER:
      return handleSetUser(state, action)
    
    case ActionTypes.LOGOUT:
      return handleLogout(state, action)
    
    case ActionTypes.SET_ROOM_LIST:
      return handleSetRoomList(state, action)
    
    case ActionTypes.SET_CURRENT_ROOM:
      return handleSetCurrentRoom(state, action)
    
    case ActionTypes.CLEAR_CURRENT_ROOM:
      return handleClearCurrentRoom(state, action)
    
    case ActionTypes.UPDATE_ROOM_IN_LIST:
      return handleUpdateRoomInList(state, action)
    
    case ActionTypes.SET_SUBJECTS:
      return handleSetSubjects(state, action)

    case ActionTypes.ADD_SUBJECT:
      return handleAddSubject(state, action)
    
    case ActionTypes.SET_CURRENT_PAGE:
      return handleSetCurrentPage(state, action)
    
    case ActionTypes.SET_MODERATOR_MESSAGE:
      return handleSetModeratorMessage(state, action)
    
    case ActionTypes.SET_SOCKET_CONNECTION:
      return handleSetSocketConnection(state, action)
    
    case ActionTypes.ADD_CHAT_MESSAGE:
      return handleAddChatMessage(state, action)
    
    case ActionTypes.SET_CHAT_MESSAGES:
      return handleSetChatMessages(state, action)
    
    case ActionTypes.CLEAR_CHAT_MESSAGES:
      return handleClearChatMessages(state, action)
    
    case ActionTypes.SET_ROOM_PLAYERS:
      return handleSetRoomPlayers(state, action)
    
    case ActionTypes.UPDATE_PLAYER_IN_ROOM:
      return handleUpdatePlayerInRoom(state, action)
    
    case ActionTypes.SET_CURRENT_TURN_PLAYER:
      return handleSetCurrentTurnPlayer(state, action)
    
    case ActionTypes.SET_GAME_STATUS:
      return handleSetGameStatus(state, action)
    
    case ActionTypes.SET_CURRENT_ROUND:
      return handleSetCurrentRound(state, action)
    
    case ActionTypes.SET_PLAYER_ROLE:
      return handleSetPlayerRole(state, action)
    
    case ActionTypes.SET_ASSIGNED_WORD:
      return handleSetAssignedWord(state, action)
    
    case ActionTypes.SET_GAME_TIMER:
      return handleSetGameTimer(state, action)
    
    case ActionTypes.SET_VOTING_RESULTS:
      return handleSetVotingResults(state, action)
    
    case ActionTypes.SET_VOTING_DATA:
      return handleSetVotingData(state, action)
    
    case ActionTypes.SET_VOTING_PROGRESS:
      return handleSetVotingProgress(state, action)
    
    case ActionTypes.SET_MY_VOTE:
      return handleSetMyVote(state, action)
    
    case ActionTypes.SET_GAME_RESULTS:
      return handleSetGameResults(state, action)
    
    case ActionTypes.SET_ACCUSED_PLAYER:
      return handleSetAccusedPlayer(state, action)
    
    case ActionTypes.SET_DEFENDING_PLAYER:
      return handleSetDefendingPlayer(state, action)
    
    case ActionTypes.SET_DEFENSE_TEXT:
      return handleSetDefenseText(state, action)
    
    case ActionTypes.SET_SURVIVAL_VOTING_PROGRESS:
      return handleSetSurvivalVotingProgress(state, action)
    
    case ActionTypes.SET_MY_SURVIVAL_VOTE:
      return handleSetMySurvivalVote(state, action)
    
    case ActionTypes.SET_WORD_GUESS_RESULT:
      return handleSetWordGuessResult(state, action)
    
    case ActionTypes.SET_FINAL_GAME_RESULT:
      return handleSetFinalGameResult(state, action)
    
    case ActionTypes.RESET_GAME_STATE:
      return handleResetGameState(state, action)
    
    default:
      return state
  }
}