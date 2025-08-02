import apiClient from './apiClient'
import config from '../config/environment'

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

// 백엔드 데이터를 프론트엔드 형식으로 변환하는 매핑 함수
const mapBackendRoomToFrontend = (backendRoom) => {
  return {
    gameNumber: backendRoom.gameNumber,
    title: backendRoom.gameName || backendRoom.title, // gameName → title
    host: backendRoom.host || '알 수 없음',
    currentPlayers: backendRoom.playerCount || backendRoom.currentPlayers,
    maxPlayers: backendRoom.maxPlayers,
    hasPassword: backendRoom.hasPassword,
    subject: backendRoom.subject || '주제 없음',
    state: backendRoom.status || backendRoom.state, // status → state
    // 프론트엔드 추가 필드
    players: backendRoom.players || [],
    password: backendRoom.password || null,
    playerCount: backendRoom.playerCount || backendRoom.currentPlayers // LobbyPage에서 사용하는 필드
  }
}

export const getAllRooms = async () => {
  if (config.useDummyData) {
    console.log('[DEBUG] Using dummy room data (environment setting)')
    return dummyData.rooms
  }
  
  try {
    const response = await apiClient.get('/game/rooms')
    
    // 🔍 임시 디버깅 (검증 후 제거 예정)
    console.log('=== API RESPONSE STRUCTURE DEBUG ===')
    console.log('Full response:', response)
    console.log('response.data type:', typeof response.data)
    console.log('response.data:', response.data)
    console.log('Is response.data an array?', Array.isArray(response.data))
    console.log('Does response.data.rooms exist?', !!response.data?.rooms)
    console.log('Is response.data.rooms an array?', Array.isArray(response.data?.rooms))
    if (response.data?.rooms) {
      console.log('response.data.rooms length:', response.data.rooms.length)
      console.log('First room example:', response.data.rooms[0])
    }
    console.log('===================================')
    
    console.log('[DEBUG] Raw API response:', response.data)
    
    let rooms = []
    if (response.data && response.data.rooms && Array.isArray(response.data.rooms)) {
      rooms = response.data.rooms
    } else if (Array.isArray(response.data)) {
      rooms = response.data
    } else {
      console.warn('[DEBUG] Unexpected API response structure:', response.data)
      return []
    }
    
    // ✅ 백엔드 데이터를 프론트엔드 형식으로 변환
    const mappedRooms = rooms.map(mapBackendRoomToFrontend)
    console.log('[DEBUG] Mapped rooms for frontend:', mappedRooms)
    
    return mappedRooms
  } catch (error) {
    console.error('API failed, falling back to dummy data:', error)
    return dummyData.rooms
  }
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

export const getRoomInfo = async (gNumber) => {
  const response = await apiClient.get(`/game/${gNumber}`)
  return response.data
}

export const startGame = async (gNumber) => {
  const response = await apiClient.post('/game/start', { gNumber })
  return response.data
}

export const getGameState = async (gNumber) => {
  const response = await apiClient.get(`/game/${gNumber}`)
  return response.data
}

// ==================== Subject Operations ====================

export const getAllSubjects = async () => {
  if (config.useDummyData) {
    console.log('[DEBUG] Using dummy subjects data (environment setting)')
    return dummyData.subjects
  }
  
  try {
    const response = await apiClient.get('/subjects/listsubj')
    
    // 🔍 임시 디버깅 (검증 후 제거 예정)
    console.log('=== SUBJECTS API RESPONSE STRUCTURE DEBUG ===')
    console.log('Full response:', response)
    console.log('response.data type:', typeof response.data)
    console.log('response.data:', response.data)
    console.log('Is response.data an array?', Array.isArray(response.data))
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('First subject example:', response.data[0])
      console.log('First subject keys:', Object.keys(response.data[0] || {}))
    }
    console.log('===============================================')
    
    console.log('[DEBUG] Raw subjects API response:', response.data)
    
    let subjects = []
    if (Array.isArray(response.data)) {
      subjects = response.data
    } else if (response.data && response.data.subjects && Array.isArray(response.data.subjects)) {
      subjects = response.data.subjects
    } else {
      console.warn('[DEBUG] Unexpected subjects API response structure:', response.data)
      return dummyData.subjects
    }
    
    // ✅ 각 주제 객체의 필드 검증 및 정규화
    const validSubjects = subjects
      .filter(subject => subject && typeof subject === 'object')
      .map(subject => ({
        id: subject.id || subject.subjectId || Date.now() + Math.random(),
        name: subject.name || subject.subjectName || subject.title || '이름 없음'
      }))
      .filter(subject => subject.name && subject.name !== '이름 없음')
    
    if (validSubjects.length !== subjects.length) {
      console.warn('[WARN] Some subjects had invalid structure and were filtered out:', 
        subjects.length - validSubjects.length, 'subjects removed')
    }
    
    console.log('[DEBUG] Processed subjects for frontend:', validSubjects)
    
    return validSubjects.length > 0 ? validSubjects : dummyData.subjects
  } catch (error) {
    console.error('Subjects API failed, falling back to dummy data:', error)
    return dummyData.subjects
  }
}

export const addSubject = async (name) => {
  try {
    console.log('[DEBUG] Adding subject via API:', name)
    const response = await apiClient.post('/subjects/applysubj', { name })
    console.log('[DEBUG] Add subject API response:', response.data)
    
    // ✅ 응답 구조 검증 및 정규화
    if (response.data) {
      const result = {
        id: response.data.id || response.data.subjectId || Date.now(),
        name: response.data.name || response.data.subjectName || name,
        success: response.data.success !== false // 기본값 true
      }
      console.log('[DEBUG] Normalized add subject response:', result)
      return result
    }
    
    // 응답이 없는 경우 기본 구조 반환
    return { id: Date.now(), name: name, success: true }
  } catch (error) {
    console.error('Add subject API failed:', error)
    throw error
  }
}

export const addWord = async (subject, word) => {
  try {
    console.log('[DEBUG] Adding word via API:', { subject, word })
    const response = await apiClient.post('/words/applyw', { subject, word })
    console.log('[DEBUG] Add word API response:', response.data)
    
    // ✅ 응답 구조 검증 및 정규화
    if (response.data) {
      const result = {
        id: response.data.id || response.data.wordId || Date.now(),
        word: response.data.word || word,
        subject: response.data.subject || subject,
        success: response.data.success !== false // 기본값 true
      }
      console.log('[DEBUG] Normalized add word response:', result)
      return result
    }
    
    // 응답이 없는 경우 기본 구조 반환
    return { id: Date.now(), word: word, subject: subject, success: true }
  } catch (error) {
    console.error('Add word API failed:', error)
    throw error
  }
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