/**
 * Data transformation utilities for normalizing API responses
 * and converting data between different formats
 */

/**
 * Normalizes room data from API response to UI-friendly format
 * @param {Object} room - Raw room data from API
 * @returns {Object} Normalized room data
 */
export const normalizeRoomData = (room) => {
  if (!room || typeof room !== 'object') {
    console.warn('[DEBUG_LOG] Invalid room data provided to normalizeRoomData:', room);
    return null;
  }

  return {
    gameNumber: room.gameNumber,
    title: room.title || room.gameName,
    host: room.host || room.gameOwner,
    playerCount: room.playerCount || room.currentPlayers || 0,
    currentPlayers: room.playerCount || room.currentPlayers || 0,
    maxPlayers: room.maxPlayers || room.gameParticipants,
    hasPassword: room.hasPassword || (room.gamePassword != null),
    subject: room.subject || room.citizenSubject?.content,
    state: room.state || room.gameState,
    players: room.players || []
  };
};

/**
 * Normalizes player data structure for consistency
 * @param {Object} player - Raw player data
 * @returns {Object} Normalized player data
 */
export const normalizePlayerData = (player) => {
  if (!player || typeof player !== 'object') {
    console.warn('[DEBUG_LOG] Invalid player data provided to normalizePlayerData:', player);
    return null;
  }

  return {
    id: player.id || player.playerId,
    nickname: player.nickname || player.playerName,
    isHost: player.isHost || false,
    isAlive: player.isAlive !== false, // Default to true unless explicitly false
    isReady: player.isReady || false,
    role: player.role || null,
    votedFor: player.votedFor || null,
    survivalVote: player.survivalVote || null
  };
};

/**
 * Normalizes subject data from API response
 * @param {Object} subject - Raw subject data
 * @returns {Object} Normalized subject data
 */
export const normalizeSubjectData = (subject) => {
  if (!subject || typeof subject !== 'object') {
    console.warn('[DEBUG_LOG] Invalid subject data provided to normalizeSubjectData:', subject);
    return null;
  }

  return {
    id: subject.id || subject.subjectId,
    content: subject.content || subject.subjectContent,
    keywords: subject.keywords || [],
    createdAt: subject.createdAt || null,
    createdBy: subject.createdBy || null
  };
};

/**
 * Maps game state from backend format to UI display format
 * @param {string} gameState - Backend game state
 * @returns {Object} UI-friendly game state information
 */
export const mapGameStateToUI = (gameState) => {
  const stateMapping = {
    'WAITING': {
      display: '대기 중',
      color: 'blue',
      canJoin: true,
      description: '플레이어들이 입장하기를 기다리고 있습니다'
    },
    'SPEAKING': {
      display: '발언 중',
      color: 'green',
      canJoin: false,
      description: '게임이 진행 중입니다 - 플레이어들이 발언하고 있습니다'
    },
    'VOTING': {
      display: '투표 중',
      color: 'orange',
      canJoin: false,
      description: '게임이 진행 중입니다 - 투표가 진행되고 있습니다'
    },
    'RESULTS': {
      display: '결과 확인',
      color: 'purple',
      canJoin: false,
      description: '게임 결과를 확인하고 있습니다'
    },
    'FINISHED': {
      display: '게임 종료',
      color: 'gray',
      canJoin: false,
      description: '게임이 종료되었습니다'
    }
  };

  return stateMapping[gameState] || {
    display: gameState || '알 수 없음',
    color: 'gray',
    canJoin: false,
    description: '알 수 없는 게임 상태입니다'
  };
};

/**
 * Normalizes chat message data
 * @param {Object} message - Raw chat message
 * @returns {Object} Normalized chat message
 */
export const normalizeChatMessage = (message) => {
  if (!message || typeof message !== 'object') {
    console.warn('[DEBUG_LOG] Invalid message data provided to normalizeChatMessage:', message);
    return null;
  }

  return {
    id: message.id || `${Date.now()}-${Math.random()}`,
    content: message.content || message.message || '',
    sender: normalizePlayerData(message.sender || message.player),
    timestamp: message.timestamp || Date.now(),
    type: message.type || 'CHAT', // 'CHAT', 'SYSTEM', 'GAME'
    gameNumber: message.gameNumber || null
  };
};

/**
 * Normalizes voting data structure
 * @param {Object} votingData - Raw voting data
 * @returns {Object} Normalized voting data
 */
export const normalizeVotingData = (votingData) => {
  if (!votingData || typeof votingData !== 'object') {
    console.warn('[DEBUG_LOG] Invalid voting data provided to normalizeVotingData:', votingData);
    return null;
  }

  return {
    votingId: votingData.votingId || votingData.id,
    type: votingData.type || 'LIAR_VOTE', // 'LIAR_VOTE', 'SURVIVAL_VOTE'
    candidates: (votingData.candidates || []).map(normalizePlayerData).filter(Boolean),
    deadline: votingData.deadline || null,
    results: votingData.results || null,
    progress: {
      voted: votingData.voted || votingData.votedCount || 0,
      total: votingData.total || votingData.totalCount || 0
    }
  };
};

/**
 * Normalizes game results data
 * @param {Object} results - Raw game results
 * @returns {Object} Normalized game results
 */
export const normalizeGameResults = (results) => {
  if (!results || typeof results !== 'object') {
    console.warn('[DEBUG_LOG] Invalid game results provided to normalizeGameResults:', results);
    return null;
  }

  return {
    winner: results.winner || null, // 'LIAR', 'CITIZEN', null
    message: results.message || '',
    liarPlayer: results.liarPlayer ? normalizePlayerData(results.liarPlayer) : null,
    accusedPlayer: results.accusedPlayer ? normalizePlayerData(results.accusedPlayer) : null,
    correctWord: results.correctWord || null,
    guessedWord: results.guessedWord || null,
    isWordGuessCorrect: results.isWordGuessCorrect || false,
    finalScores: results.finalScores || [],
    gameEndReason: results.gameEndReason || 'NORMAL' // 'NORMAL', 'DISCONNECT', 'ERROR'
  };
};

/**
 * Transforms array of raw rooms to normalized format
 * @param {Array} rooms - Array of raw room data
 * @returns {Array} Array of normalized room data
 */
export const normalizeRoomsList = (rooms) => {
  if (!Array.isArray(rooms)) {
    console.error('[DEBUG_LOG] Expected array but received:', typeof rooms, rooms);
    return [];
  }

  return rooms
    .map(normalizeRoomData)
    .filter(Boolean); // Remove any null results from invalid data
};

/**
 * Transforms array of raw players to normalized format
 * @param {Array} players - Array of raw player data
 * @returns {Array} Array of normalized player data
 */
export const normalizePlayersList = (players) => {
  if (!Array.isArray(players)) {
    console.warn('[DEBUG_LOG] Expected array but received:', typeof players, players);
    return [];
  }

  return players
    .map(normalizePlayerData)
    .filter(Boolean); // Remove any null results from invalid data
};

/**
 * Transforms array of raw subjects to normalized format
 * @param {Array} subjects - Array of raw subject data
 * @returns {Array} Array of normalized subject data
 */
export const normalizeSubjectsList = (subjects) => {
  if (!Array.isArray(subjects)) {
    console.warn('[DEBUG_LOG] Expected array but received:', typeof subjects, subjects);
    return [];
  }

  return subjects
    .map(normalizeSubjectData)
    .filter(Boolean); // Remove any null results from invalid data
};

/**
 * Creates user data structure from login response
 * @param {Object} loginResponse - Response from login API
 * @param {string} nickname - User provided nickname
 * @returns {Object} Normalized user data
 */
export const createUserDataFromLogin = (loginResponse, nickname) => {
  if (!loginResponse || !nickname) {
    console.warn('[DEBUG_LOG] Invalid login data provided:', { loginResponse, nickname });
    return null;
  }

  return {
    id: loginResponse.userId || loginResponse.id,
    nickname: nickname,
    isAuthenticated: true,
    loginTime: Date.now()
  };
};

/**
 * Validates and transforms room creation data
 * @param {Object} roomData - Raw room creation data
 * @returns {Object} Validated and transformed room data
 */
export const transformRoomCreationData = (roomData) => {
  if (!roomData || typeof roomData !== 'object') {
    console.warn('[DEBUG_LOG] Invalid room creation data:', roomData);
    return null;
  }

  return {
    gameName: roomData.gameName || roomData.title || '',
    gameParticipants: roomData.gameParticipants || roomData.maxPlayers || 4,
    gamePassword: roomData.gamePassword || null,
    subjectIds: roomData.subjectIds || [],
    gameSettings: roomData.gameSettings || {}
  };
};