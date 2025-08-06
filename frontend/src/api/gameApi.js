import apiClient from './apiClient'

export const login = async (nickname) => {
  const response = await apiClient.post('/auth/login', { nickname })
  return response.data
}



export const addUser = async (nickname, profileImgUrl) => {
  const response = await apiClient.post('/user/add', { nickname, profileImgUrl })
  return response.data
}

export const getAllRooms = async () => {
  try {
    const response = await apiClient.get('/game/rooms')
    
    console.log('[DEBUG] Raw API response:', response.data)

    if (response.data && response.data.gameRooms && Array.isArray(response.data.gameRooms)) {
      console.log('[DEBUG] Found gameRooms:', response.data.gameRooms.length, 'rooms')
      return response.data.gameRooms
    } else {
      console.warn('[DEBUG] Unexpected API response structure:', response.data)
      console.warn('[DEBUG] Available keys:', Object.keys(response.data || {}))
      return []
    }
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
    throw error
  }
}

export const createRoom = async (roomData) => {
  const response = await apiClient.post('/game/create', roomData)
  return response.data // Returns game number
}

export const joinRoom = async (gameNumber, password = '') => {
  const response = await apiClient.post('/game/join', { gameNumber, password })
  return response.data
}

export const leaveRoom = async (data) => {
  console.log('[DEBUG_LOG] LeaveRoom API call with data:', data)
  if (!data.gameNumber || data.gameNumber <= 0) {
    throw new Error('Invalid game number')
  }
  const response = await apiClient.post('/game/leave', {
    gameNumber: parseInt(data.gameNumber)
  })
  return response.data
}

export const getRoomInfo = async (gameNumber) => {
  const response = await apiClient.get(`/game/${gameNumber}`)
  return response.data
}

export const startGame = async (gameNumber) => {
  const response = await apiClient.post('/game/start', { gameNumber })
  return response.data
}

export const getGameState = async (gameNumber) => {
  const response = await apiClient.get(`/game/${gameNumber}`)
  return response.data
}

export const getRoomDetails = async (gameNumber) => {
  try {
    if (!gameNumber) {
      throw new Error('Game number is required')
    }
    
    const response = await apiClient.get(`/game/${gameNumber}`)
    return response.data
  } catch (error) {
    console.error('Failed to get room details:', error)
    throw error
  }
}

// 플레이어 목록 조회 API 추가
export const getRoomPlayers = async (gameNumber) => {
  try {
    const response = await apiClient.get(`/game/${gameNumber}`)
    // Extract players from game state response
    return response.data?.players || []
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

    if (Array.isArray(response.data)) {
      const subjectMap = new Map()

      response.data.forEach(subject => {
        if (subject && subject.name) {
          const key = subject.name.toLowerCase()
          subjectMap.set(key, subject)
        }
      })
      const uniqueSubjects = Array.from(subjectMap.values())

      console.log('[DEBUG] Found unique subjects:', uniqueSubjects.length, 'subjects')
      console.log('[DEBUG] Unique subject names:', uniqueSubjects.map(s => s.name).join(', '))
      return uniqueSubjects
    } else {
      console.warn('[DEBUG] Unexpected subjects API response structure:', response.data)
      console.warn('[DEBUG] Available keys:', Object.keys(response.data || {}))
      return []
    }
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

    return response.data
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

    return response.data
  } catch (error) {
    console.error('Add word API failed:', error)
    throw error
  }
}

// ==================== Chat Operations ====================

export const sendMessage = async (gameNumber, message) => {
  const response = await apiClient.post('/chat/send', { gameNumber, message })
  return response.data
}

export const getChatHistory = async (gameNumber, limit = 50) => {
  try {
    console.log('[DEBUG] Loading chat history for game:', gameNumber)

    const response = await apiClient.get(`/chat/history`, {
      params: {
        gameNumber: parseInt(gameNumber),
        limit: limit
      }
    })

    console.log('[DEBUG] Chat history response:', response.data)
    return response.data || []
  } catch (error) {
    console.error('Failed to get chat history:', error)
    if (error.response?.status === 404) {
      return [] // 채팅 기록이 없으면 빈 배열 반환
    }
    throw error
  }
}
