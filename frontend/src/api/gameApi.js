import apiClient from './apiClient'

export const login = async (nickname) => {
  // Send JSON payload as expected by Spring controller
  const response = await apiClient.post('/auth/login', { nickname })
  return response.data
}

export const addUser = async (nickname, profileImgUrl) => {
  // Send JSON with non-null profileImgUrl (empty string default) to satisfy Kotlin non-null param
  const response = await apiClient.post('/user/add', {
    nickname,
    profileImgUrl: profileImgUrl ?? ''
  })
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
  try {
    console.log('[GAMEAPI] Sending join room request:', { gameNumber, password: password ? '***' : 'none' })
    const response = await apiClient.post('/game/join', { gameNumber, password })
    console.log('[GAMEAPI] Join room API response status:', response.status)
    console.log('[GAMEAPI] Join room API response data:', JSON.stringify(response.data, null, 2))
    return response.data
  } catch (error) {
    console.error('[GAMEAPI] Join room API failed:', error)
    console.error('[GAMEAPI] Error response:', error.response?.data)
    throw error
  }
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
  const response = await apiClient.post('/game/start', {
    gameNumber: parseInt(gameNumber),
    subjectIds: null,
    useAllSubjects: false,
    useRandomSubjects: true,
    randomSubjectCount: 1
  })
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
    const subjectStr = typeof subject === 'string'
      ? subject
      : (subject?.name || subject?.content || subject?.label || String(subject))
    console.log('[DEBUG] Adding word via API:', { subject: subjectStr, word })
    const response = await apiClient.post('/words/applyw', { subject: subjectStr, word })
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

export const getChatHistory = async (gameNumber, limit = 50, retryCount = 0) => {
  try {
    console.log('[DEBUG] Loading chat history for game:', gameNumber, 'retry:', retryCount)

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

    if (error.response?.status === 429 && retryCount < 3) {
      // 429 에러 시 지수 백오프로 재시도
      const delay = Math.pow(2, retryCount) * 1000 // 1초, 2초, 4초
      console.warn(`[WARNING] Rate limited, retrying after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return getChatHistory(gameNumber, limit, retryCount + 1)
    }

    if (error.response?.status === 429) {
      console.warn('[WARNING] Rate limit exceeded, returning empty chat history')
      return [] // 최대 재시도 후에는 빈 배열 반환
    }

    throw error
  }
}

export const completeSpeech = async (gameNumber) => {
  const response = await apiClient.post('/chat/speech/complete', {
    gameNumber: parseInt(gameNumber)
  })
  return response.data
}

// ==================== Hint Operations ====================

export const submitHint = async (gameNumber, hint) => {
  try {
    if (!gameNumber || gameNumber <= 0) {
      throw new Error('Invalid game number')
    }
    if (!hint || !hint.trim()) {
      throw new Error('Hint cannot be empty')
    }
    if (hint.trim().length > 30) {
      throw new Error('Hint cannot exceed 30 characters')
    }

    console.log('[DEBUG] Submitting hint:', { gameNumber, hint: hint.trim() })
    
    const response = await apiClient.post('/game/hint', {
      gameNumber: parseInt(gameNumber),
      hint: hint.trim()
    })
    
    console.log('[DEBUG] Hint submission response:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to submit hint:', error)
    throw error
  }
}

// ==================== Defense Operations ====================

// 변론 제출 API
export const submitDefense = async (gameNumber, defenseText) => {
  try {
    const response = await apiClient.post('/game/submit-defense', {
      gameNumber: parseInt(gameNumber),
      defenseText: defenseText.trim()
    })
    console.log('[DEBUG_LOG] Defense submitted successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('[ERROR] Failed to submit defense:', error)
    throw new Error(error.response?.data?.message || '변론 제출에 실패했습니다.')
  }
}

// 최종 판결 투표 API
export const castFinalJudgment = async (gameNumber, judgment) => {
  try {
    const response = await apiClient.post('/game/cast-final-judgment', {
      gameNumber: parseInt(gameNumber),
      judgment: judgment // "KILL" or "SPARE"
    })
    console.log('[DEBUG_LOG] Final judgment cast successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('[ERROR] Failed to cast final judgment:', error)
    throw new Error(error.response?.data?.message || '최종 판결 투표에 실패했습니다.')
  }
}

// ==================== Voting Operations ====================

export const castVote = async (gameNumber, targetPlayerId) => {
  const response = await apiClient.post('/game/vote', { gameNumber, targetPlayerId })
  return response.data
}

// ==================== Survival Voting Operations ====================

export const castSurvivalVote = async (gameNumber, survival) => {
  try {
    if (!gameNumber || gameNumber <= 0) {
      throw new Error('Invalid game number')
    }
    if (typeof survival !== 'boolean') {
      throw new Error('Survival vote must be boolean (true for spare, false for eliminate)')
    }

    console.log('[DEBUG] Casting survival vote:', { gameNumber, survival })
    
    const response = await apiClient.post('/game/survival-vote', {
      gameNumber: parseInt(gameNumber),
      survival: survival
    })
    
    console.log('[DEBUG] Survival vote response:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to cast survival vote:', error)
    throw error
  }
}

// ==================== Word Guessing Operations ====================

export const guessWord = async (gameNumber, guessedWord) => {
  try {
    if (!gameNumber || gameNumber <= 0) {
      throw new Error('Invalid game number')
    }
    if (!guessedWord || !guessedWord.trim()) {
      throw new Error('Guessed word cannot be empty')
    }
    if (guessedWord.trim().length > 20) {
      throw new Error('Guessed word cannot exceed 20 characters')
    }

    console.log('[DEBUG] Submitting word guess:', { gameNumber, guessedWord: guessedWord.trim() })
    
    const response = await apiClient.post('/game/guess-word', {
      gameNumber: parseInt(gameNumber),
      guessedWord: guessedWord.trim()
    })
    
    console.log('[DEBUG] Word guess response:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to guess word:', error)
    throw error
  }
}

// 라이어 추측 제출 API
export const submitLiarGuess = async (gameNumber, guess) => {
  try {
    const response = await apiClient.post('/game/submit-liar-guess', {
      gameNumber: parseInt(gameNumber),
      guess: guess.trim()
    })
    console.log('[DEBUG_LOG] Liar guess submitted successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('[ERROR] Failed to submit liar guess:', error)
    throw new Error(error.response?.data?.message || '라이어 추측 제출에 실패했습니다.')
  }
}

export const recoverGameState = async (gameNumber) => {
  try {
    const response = await apiClient.get(`/game/recover-state/${gameNumber}`)
    console.log('[DEBUG_LOG] Game state recovered:', response.data)
    return response.data
  } catch (error) {
    console.error('[ERROR] Failed to recover game state:', error)
    return null
  }
}
