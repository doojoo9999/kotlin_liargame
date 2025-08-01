import apiClient from './apiClient'

export const login = async (nickname) => {
  const response = await apiClient.post('/auth/login', { nickname })
  return response.data
}

export const refreshToken = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken })
  return response.data
}


export const addUser = async (nickname, profileImgUrl) => {
  const response = await apiClient.post('/user/add', { nickname, profileImgUrl })
  return response.data
}

export const getAllRooms = async () => {
  const response = await apiClient.get('/game/rooms')
  return response.data
}

export const createRoom = async (roomData) => {
  const response = await apiClient.post('/game/create', roomData)
  return response.data // Returns game number
}

export const joinRoom = async (gNumber, password = '') => {
  const response = await apiClient.post('/game/join', { gNumber, password })
  return response.data
}

export const leaveRoom = async (gNumber) => {
  const response = await apiClient.post('/game/leave', { gNumber })
  return response.data
}

export const getRoomInfo = async (roomId) => {
  const response = await apiClient.get(`/game/rooms/${roomId}`)
  return response.data
}

export const startGame = async (gNumber) => {
  const response = await apiClient.post('/game/start', { gNumber })
  return response.data
}

export const getGameState = async (gNumber) => {
  const response = await apiClient.get(`/game/state/${gNumber}`)
  return response.data
}

// ==================== Subject Operations ====================

export const getAllSubjects = async () => {
  const response = await apiClient.get('/subjects/listsubj')
  return response.data
}

export const addSubject = async (name) => {
  const response = await apiClient.post('/subjects/applysubj', { name })
  return response.data
}

// ==================== Chat Operations ====================

export const sendMessage = async (gNumber, message) => {
  const response = await apiClient.post('/chat/send', { gNumber, message })
  return response.data
}

export const getChatHistory = async (gNumber) => {
  const response = await apiClient.get(`/chat/history/${gNumber}`)
  return response.data
}

// ==================== Dummy Data for Testing ====================

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