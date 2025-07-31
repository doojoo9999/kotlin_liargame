import apiClient from './apiClient'

/**
 * Game API functions for Liar Game
 * Contains all API calls related to game rooms, authentication, and game operations
 */

// ==================== Authentication ====================

/**
 * Login with nickname and get access token
 * @param {string} nickname - User's nickname
 * @returns {Promise<{accessToken: string}>}
 */
export const login = async (nickname) => {
  const response = await apiClient.post('/auth/login', { nickname })
  return response.data
}

/**
 * Add a new user
 * @param {string} nickname - User's nickname
 * @param {string} profileImgUrl - User's profile image URL
 * @returns {Promise<void>}
 */
export const addUser = async (nickname, profileImgUrl) => {
  const response = await apiClient.post('/user/add', { nickname, profileImgUrl })
  return response.data
}

// ==================== Game Room Operations ====================

/**
 * Get all available game rooms
 * @returns {Promise<{rooms: Array}>}
 */
export const getAllRooms = async () => {
  const response = await apiClient.get('/game/rooms')
  return response.data
}

/**
 * Create a new game room
 * @param {Object} roomData - Room creation data
 * @param {string} roomData.title - Room title
 * @param {number} roomData.maxPlayers - Maximum number of players (default: 8)
 * @param {string} roomData.password - Room password (optional)
 * @param {number} roomData.subjectId - Subject ID for the game
 * @returns {Promise<number>} - Returns the game number
 */
export const createRoom = async (roomData) => {
  const response = await apiClient.post('/game/create', roomData)
  return response.data // Returns game number
}

/**
 * Join an existing game room
 * @param {number} gNumber - Game number
 * @param {string} password - Room password (optional)
 * @returns {Promise<Object>} - Returns game state with players, subject, etc.
 */
export const joinRoom = async (gNumber, password = '') => {
  const response = await apiClient.post('/game/join', { gNumber, password })
  return response.data
}

/**
 * Leave a game room
 * @param {number} gNumber - Game number
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const leaveRoom = async (gNumber) => {
  const response = await apiClient.post('/game/leave', { gNumber })
  return response.data
}

/**
 * Get specific game room information
 * @param {number} roomId - Room ID
 * @returns {Promise<Object>} - Returns game state information
 */
export const getRoomInfo = async (roomId) => {
  const response = await apiClient.get(`/game/rooms/${roomId}`)
  return response.data
}

/**
 * Start a game
 * @param {number} gNumber - Game number
 * @returns {Promise<Object>} - Returns updated game state
 */
export const startGame = async (gNumber) => {
  const response = await apiClient.post('/game/start', { gNumber })
  return response.data
}

/**
 * Get current game state
 * @param {number} gNumber - Game number
 * @returns {Promise<Object>} - Returns current game state
 */
export const getGameState = async (gNumber) => {
  const response = await apiClient.get(`/game/state/${gNumber}`)
  return response.data
}

// ==================== Subject Operations ====================

/**
 * Get all available subjects
 * @returns {Promise<Array>} - Returns array of subjects
 */
export const getAllSubjects = async () => {
  const response = await apiClient.get('/subjects/listsubj')
  return response.data
}

/**
 * Add a new subject
 * @param {string} name - Subject name
 * @returns {Promise<void>}
 */
export const addSubject = async (name) => {
  const response = await apiClient.post('/subjects/applysubj', { name })
  return response.data
}

// ==================== Chat Operations ====================

/**
 * Send a chat message
 * @param {number} gNumber - Game number
 * @param {string} message - Message content
 * @returns {Promise<void>}
 */
export const sendMessage = async (gNumber, message) => {
  const response = await apiClient.post('/chat/send', { gNumber, message })
  return response.data
}

/**
 * Get chat history for a game
 * @param {number} gNumber - Game number
 * @returns {Promise<Array>} - Returns array of chat messages
 */
export const getChatHistory = async (gNumber) => {
  const response = await apiClient.get(`/chat/history/${gNumber}`)
  return response.data
}

// ==================== Dummy Data for Testing ====================

/**
 * Dummy data for testing without backend connection
 * This will be used when the backend is not available
 */
export const dummyData = {
  rooms: [
    {
      gameNumber: 1,
      title: "초보자 방",
      host: "Player1",
      playerCount: 4,
      maxPlayers: 8,
      hasPassword: false,
      subject: "동물",
      state: "WAITING"
    },
    {
      gameNumber: 2,
      title: "고수들만",
      host: "ProGamer",
      playerCount: 6,
      maxPlayers: 10,
      hasPassword: true,
      subject: "음식",
      state: "WAITING"
    },
    {
      gameNumber: 3,
      title: "빠른 게임",
      host: "SpeedRunner",
      playerCount: 8,
      maxPlayers: 8,
      hasPassword: false,
      subject: "영화",
      state: "IN_PROGRESS"
    }
  ],
  subjects: [
    { id: 1, name: "동물" },
    { id: 2, name: "음식" },
    { id: 3, name: "영화" },
    { id: 4, name: "스포츠" },
    { id: 5, name: "직업" }
  ],
  gameState: {
    gameNumber: 1,
    gameState: "WAITING",
    gamePhase: "NONE",
    round: 0,
    players: [
      {
        id: 1,
        nickname: "Player1",
        avatarUrl: "https://via.placeholder.com/60/FF5733/FFFFFF?text=P1",
        isHost: true,
        isLiar: false,
        isAlive: true,
        hintGiven: false
      },
      {
        id: 2,
        nickname: "Player2",
        avatarUrl: "https://via.placeholder.com/60/33FF57/FFFFFF?text=P2",
        isHost: false,
        isLiar: false,
        isAlive: true,
        hintGiven: false
      }
    ],
    subject: { id: 1, name: "동물" },
    currentTurnPlayerId: null,
    accusedPlayerId: null,
    defendingPlayerId: null,
    timeRemaining: 0,
    word: null
  }
}