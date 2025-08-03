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

// 백엔드 데이터를 프론트엔드 형식으로 변환하는 매핑 함수
const mapBackendRoomToFrontend = (backendRoom) => {
  console.log('[DEBUG] Mapping backend room:', backendRoom)
  
  // 백엔드 필드명 → 프론트엔드 필드명 매핑
  return {
    gameNumber: backendRoom.gameNumber || backendRoom.gNumber,
    title: backendRoom.gameName || backendRoom.gName || backendRoom.title || '제목 없음',
    host: backendRoom.host || backendRoom.hostName || '알 수 없음',
    currentPlayers: backendRoom.playerCount || backendRoom.currentPlayers || 0,
    maxPlayers: backendRoom.maxPlayers || backendRoom.gParticipants || 8,
    hasPassword: backendRoom.hasPassword || backendRoom.isPasswordProtected || false,
    subject: backendRoom.subject || backendRoom.gSubject || '주제 없음',
    state: backendRoom.status || backendRoom.gState || backendRoom.state || 'WAITING',
    // 프론트엔드 추가 필드
    players: backendRoom.players || [],
    password: null,
    playerCount: backendRoom.playerCount || backendRoom.currentPlayers || 0 // LobbyPage에서 사용하는 필드
  }
}

export const getAllRooms = async () => {
  try {
    const response = await apiClient.get('/game/rooms')
    
    console.log('[DEBUG] Raw API response:', response.data)
    
    let rooms = []

    // ✅ 백엔드 실제 응답 구조에 맞게 수정
    if (response.data && response.data.gameRooms && Array.isArray(response.data.gameRooms)) {
      rooms = response.data.gameRooms  // ✅ "gameRooms" 키 사용
      console.log('[DEBUG] Found gameRooms:', rooms.length, 'rooms')
    } else if (response.data && response.data.rooms && Array.isArray(response.data.rooms)) {
      rooms = response.data.rooms      // ✅ 기존 "rooms" 키도 지원 (호환성)
      console.log('[DEBUG] Found rooms:', rooms.length, 'rooms')
    } else if (Array.isArray(response.data)) {
      rooms = response.data
      console.log('[DEBUG] Response data is direct array:', rooms.length, 'rooms')
    } else {
      console.warn('[DEBUG] Unexpected API response structure:', response.data)
      console.warn('[DEBUG] Available keys:', Object.keys(response.data || {}))
      return []
    }
    
    // ✅ 백엔드 데이터를 프론트엔드 형식으로 변환
    const mappedRooms = rooms.map(mapBackendRoomToFrontend)
    console.log('[DEBUG] Mapped rooms for frontend:', mappedRooms)
    
    return mappedRooms
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    throw error
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

export const leaveRoom = async (data) => {
  console.log('[DEBUG_LOG] LeaveRoom API call with data:', data)
  if (!data.gNumber || data.gNumber <= 0) {
    throw new Error('Invalid game number')
  }
  const response = await apiClient.post('/game/leave', {
    gNumber: parseInt(data.gNumber)
  })
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

export const getRoomDetails = async (gameNumber) => {
  try {
    if (!gameNumber) {
      throw new Error('Game number is required')
    }
    
    const response = await apiClient.get(`/game/room/${gameNumber}`)
    return response.data
  } catch (error) {
    console.error('Failed to get room details:', error)
    throw error
  }
}

// 플레이어 목록 조회 API 추가
export const getRoomPlayers = async (gameNumber) => {
  try {
    const response = await apiClient.get(`/game/room/${gameNumber}/players`)
    return response.data || []
  } catch (error) {
    console.error('Failed to get room players:', error)
    return []
  }
}

// ==================== Subject Operations ====================

export const getAllSubjects = async () => {
  try {
    const response = await apiClient.get('/subjects/listsubj')
    
    console.log('[DEBUG] Raw subjects API response:', response.data)
    
    let subjects = []
    if (Array.isArray(response.data)) {
      subjects = response.data
    } else if (response.data && response.data.subjects && Array.isArray(response.data.subjects)) {
      subjects = response.data.subjects
    } else {
      console.warn('[DEBUG] Unexpected subjects API response structure:', response.data)
      return []
    }

    const validSubjects = subjects
      .filter(subject => subject && typeof subject === 'object')
      .map(subject => ({
        id: subject.id || subject.subjectId || Date.now() + Math.random(),
        name: subject.name || subject.subjectName || subject.content || subject.title || '이름 없음'
      }))
      .filter(subject => subject.name && subject.name !== '이름 없음')
    
    if (validSubjects.length !== subjects.length) {
      console.warn('[WARN] Some subjects had invalid structure and were filtered out:', 
        subjects.length - validSubjects.length, 'subjects removed')
    }
    
    console.log('[DEBUG] Processed subjects for frontend:', validSubjects)
    
    return validSubjects
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
    throw error
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
