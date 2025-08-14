import * as gameApi from './gameApi'

// Room API functions
// This module handles only room-related API calls

export const fetchAllRooms = async () => {
  const rooms = await gameApi.getAllRooms()

  if (!Array.isArray(rooms)) {
    console.error('[ERROR] API response is not array:', rooms)
    throw new Error('API 응답 오류가 발생했습니다.')
  }

  const mappedRooms = rooms.map(room => ({
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
  }))

  return mappedRooms
}

export const createNewRoom = async (roomData, currentUser, getSubjectById) => {
  const result = await gameApi.createRoom(roomData)
  
  const createdRoom = {
    gameNumber: result.gameNumber || result,
    title: roomData.gameName,
    maxPlayers: roomData.gameParticipants,
    currentPlayers: 1,
    gameState: 'WAITING',
    subject: roomData.subjectIds?.length > 0 ? await getSubjectById(roomData.subjectIds[0]) : null,
    players: [{
      id: currentUser.id,
      nickname: currentUser.nickname,
      isHost: true,
      isAlive: true,
      avatarUrl: null
    }],
    password: roomData.gamePassword,
    rounds: roomData.gameTotalRounds
  }
  
  return createdRoom
}

export const joinExistingRoom = async (gameNumber, password = '') => {
  const response = await gameApi.joinRoom(gameNumber, password)
  return response
}

export const getRoomDetails = async (gameNumber) => {
  const roomData = await gameApi.getRoomDetails(gameNumber)
  
  if (!roomData) {
    throw new Error('방 정보를 찾을 수 없습니다.')
  }
  
  // 플레이어 데이터 구조 검증
  if (roomData.players && Array.isArray(roomData.players)) {
    roomData.players = roomData.players.map((player, index) => ({
      id: player.id || index + 1, // id가 없으면 인덱스 사용
      nickname: player.nickname || `Player${index + 1}`,
      isHost: player.isHost || false,
      isAlive: player.isAlive !== false, // 기본값 true
      avatar: player.avatar || null
    }))
  } else {
    roomData.players = []
  }
  
  return roomData
}

export const leaveExistingRoom = async (gameNumber) => {
  console.log('[DEBUG_LOG] Leaving room with gameNumber:', gameNumber)
  const response = await gameApi.leaveRoom({
    gameNumber: parseInt(gameNumber)
  })
  console.log('[DEBUG_LOG] Leave room response:', response)
  return response
}