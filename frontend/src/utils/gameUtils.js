import {createPlayerData, createRoomData, RoomStateTypes} from '../context/gameTypes'

// Normalize room data from API response
export const normalizeRoomData = (room) => {
  if (!room) return null

  return createRoomData({
    gameNumber: room.gameNumber,
    title: room.title || room.gameName,
    host: room.host || room.gameOwner,
    currentPlayers: room.playerCount || room.currentPlayers || 0,
    maxPlayers: room.maxPlayers || room.gameParticipants,
    hasPassword: room.hasPassword || (room.gamePassword != null),
    subject: room.subject || room.citizenSubject?.content,
    subjects: room.subjects || [],
    state: room.state || room.gameState || RoomStateTypes.WAITING,
    players: room.players || [],
    password: room.gamePassword,
    rounds: room.gameTotalRounds || 1
  })
}

// Normalize multiple rooms from API response
export const normalizeRoomsData = (rooms) => {
  if (!Array.isArray(rooms)) {
    console.error('[ERROR] API response is not array:', rooms)
    return []
  }

  return rooms.map(normalizeRoomData).filter(Boolean)
}

// Validate and normalize player data
export const normalizePlayerData = (player, index = 0) => {
  if (!player) return null

  return createPlayerData({
    id: player.id || index + 1, // id가 없으면 인덱스 사용
    nickname: player.nickname || `Player${index + 1}`,
    isHost: player.isHost || false,
    isAlive: player.isAlive !== false, // 기본값 true
    avatar: player.avatar || null,
    avatarUrl: player.avatarUrl || null
  })
}

// Validate and normalize players array
export const normalizePlayersData = (players) => {
  if (!Array.isArray(players)) {
    return []
  }

  return players.map((player, index) => normalizePlayerData(player, index)).filter(Boolean)
}

// Check if room has password
export const roomHasPassword = (room) => {
  return !!(room?.hasPassword || room?.password || room?.gamePassword)
}

// Check if player is host
export const isPlayerHost = (player) => {
  return !!(player?.isHost)
}

// Check if player is alive
export const isPlayerAlive = (player) => {
  return player?.isAlive !== false
}

// Get available players for voting (exclude self and dead players)
export const getAvailablePlayersForVoting = (players, currentUserId) => {
  return players.filter(player => 
    player.id !== currentUserId && isPlayerAlive(player)
  )
}

// Find player by ID
export const findPlayerById = (players, playerId) => {
  return players.find(player => player.id === playerId)
}

// Find player by nickname
export const findPlayerByNickname = (players, nickname) => {
  return players.find(player => player.nickname === nickname)
}

// Check if user is host of the room
export const isUserHostOfRoom = (room, user) => {
  if (!room || !user) return false
  
  const hostPlayer = room.players?.find(player => isPlayerHost(player))
  return hostPlayer?.id === user.id || hostPlayer?.nickname === user.nickname
}

// Get room player count text
export const getRoomPlayerCountText = (room) => {
  if (!room) return '0/0'
  
  const current = room.currentPlayers || 0
  const max = room.maxPlayers || 0
  return `${current}/${max}`
}

// Check if room is full
export const isRoomFull = (room) => {
  if (!room) return true
  
  const current = room.currentPlayers || 0
  const max = room.maxPlayers || 0
  return current >= max
}

// Check if room can be joined
export const canJoinRoom = (room, user) => {
  if (!room || !user) return false
  
  // Check if room is full
  if (isRoomFull(room)) return false
  
  // Check if user is already in room
  const userInRoom = room.players?.some(player => 
    player.id === user.id || player.nickname === user.nickname
  )
  
  return !userInRoom
}

// Sort chat messages by timestamp
export const sortChatMessagesByTimestamp = (messages) => {
  if (!Array.isArray(messages)) return []
  
  return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// Validate game number
export const isValidGameNumber = (gameNumber) => {
  return gameNumber && (typeof gameNumber === 'number' || typeof gameNumber === 'string') && !isNaN(Number(gameNumber))
}

// Create room update payload for WebSocket
export const createRoomUpdatePayload = (roomData) => {
  return {
    gameNumber: roomData.gameNumber,
    currentPlayers: roomData.currentPlayers,
    maxPlayers: roomData.maxPlayers,
    title: roomData.title,
    subject: roomData.subject,
    subjects: roomData.subjects || [],
    state: roomData.state
  }
}

// Validate room data structure
export const validateRoomData = (room) => {
  if (!room) return false
  
  return !!(
    room.gameNumber &&
    room.title &&
    typeof room.maxPlayers === 'number' &&
    room.maxPlayers > 0
  )
}

// Validate player data structure
export const validatePlayerData = (player) => {
  if (!player) return false
  
  return !!(
    (player.id || player.id === 0) &&
    player.nickname &&
    typeof player.isHost === 'boolean' &&
    typeof player.isAlive === 'boolean'
  )
}