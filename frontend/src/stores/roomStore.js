import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import * as gameApi from '../api/gameApi'
import useAuthStore from './authStore'

const useRoomStore = create(
  subscribeWithSelector((set, get) => ({
    roomList: [],
    currentRoom: null,
    currentPage: 'lobby', // 'lobby' | 'room'
    loading: {
      rooms: false,
      room: false,
    },
    error: {
      rooms: null,
      room: null,
    },

    fetchRooms: async () => {
      try {
        set(state => ({ 
          loading: { ...state.loading, rooms: true },
          error: { ...state.error, rooms: null }
        }))

        const rooms = await gameApi.getAllRooms()

        if (!Array.isArray(rooms)) {
          console.error('[ERROR] API response is not array:', rooms)
          set(state => ({
            roomList: [],
            error: { ...state.error, rooms: 'API 응답 오류가 발생했습니다.' },
            loading: { ...state.loading, rooms: false }
          }))
          return
        }

        const mappedRooms = rooms.map(room => ({
          id: parseInt(room.gameNumber, 10),
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

        console.log('[DEBUG] Mapped rooms:', mappedRooms.length)
        set(state => ({
          roomList: mappedRooms,
          loading: { ...state.loading, rooms: false }
        }))

      } catch (error) {
        console.error('Failed to fetch rooms:', error)
        set(state => ({
          error: { ...state.error, rooms: '방 목록을 불러오는데 실패했습니다.' },
          roomList: [],
          loading: { ...state.loading, rooms: false }
        }))
      }
    },

    createRoom: async (roomData) => {
      try {
        const { currentUser } = useAuthStore.getState()
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.')
        }

        set(state => ({ 
          loading: { ...state.loading, room: true },
          error: { ...state.error, room: null }
        }))
        
        const result = await gameApi.createRoom(roomData)
        
        const rawGameNumber = result?.gameNumber ?? result
        const normalizedGameNumber = parseInt(rawGameNumber, 10)
        if (!Number.isFinite(normalizedGameNumber) || normalizedGameNumber <= 0) {
          const msg = `gameNumber가 양수여야 합니다. 받은 값: ${rawGameNumber}`
          console.error('[ROOMSTORE] Invalid gameNumber on createRoom:', msg)
          throw new Error(msg)
        }

        // Just fetch the details and set the state. Navigation will be handled by the component.
        const createdRoom = await get().getCurrentRoom(normalizedGameNumber)
        return createdRoom
      } catch (error) {
        console.error('Failed to create room:', error)
        const message = error?.message?.includes('gameNumber')
          ? error.message
          : '방 생성에 실패했습니다.'
        set(state => ({
          error: { ...state.error, room: message },
          loading: { ...state.loading, room: false }
        }))
        throw error
      }
    },

    joinRoom: async (gameNumber, password = '') => {
      try {
        console.log('[ROOMSTORE] Starting joinRoom for game:', gameNumber, 'with password:', password ? '***' : 'none')

        set(state => ({
          loading: { ...state.loading, room: true },
          error: { ...state.error, room: null }
        }))

        // Normalize input gameNumber to integer and validate
        const normalizedInput = parseInt(gameNumber, 10)
        if (!Number.isFinite(normalizedInput) || normalizedInput <= 0) {
          const msg = `gameNumber가 양수여야 합니다. 받은 값: ${gameNumber}`
          console.error('[ROOMSTORE] Invalid gameNumber on joinRoom:', msg)
          throw new Error(msg)
        }

        console.log('[ROOMSTORE] Calling gameApi.joinRoom with normalized gameNumber:', normalizedInput)
        const response = await gameApi.joinRoom(normalizedInput, password)
        console.log('[ROOMSTORE] Raw API response:', JSON.stringify(response, null, 2))

        // Normalize the room data
        const rawRespGameNumber = response?.gameNumber ?? normalizedInput
        const normalizedRespGameNumber = parseInt(rawRespGameNumber, 10)
        if (!Number.isFinite(normalizedRespGameNumber) || normalizedRespGameNumber <= 0) {
          const msg = `서버 응답의 gameNumber가 유효하지 않습니다. 받은 값: ${rawRespGameNumber}`
          console.error('[ROOMSTORE] Invalid response gameNumber on joinRoom:', msg)
          throw new Error(msg)
        }

        const normalizedRoom = {
          id: normalizedRespGameNumber,
          gameNumber: normalizedRespGameNumber,
          title: response.title || response.gameName || `방 #${normalizedRespGameNumber}`,
          maxPlayers: parseInt(response.maxPlayers || response.gameParticipants || 8, 10),
          currentPlayers: parseInt(response.currentPlayers || response.playerCount || 1, 10),
          state: response.state || response.gameState || 'WAITING',
          players: response.players || [],
          ...response
        }

        console.log('[ROOMSTORE] Normalized room data:', JSON.stringify(normalizedRoom, null, 2))

        set(state => ({
          currentRoom: normalizedRoom,
          currentPage: 'room',
          loading: { ...state.loading, room: false }
        }))

        console.log('[ROOMSTORE] Room join completed successfully, returning:', normalizedRoom.gameNumber)

        return normalizedRoom
      } catch (error) {
        console.error('[ROOMSTORE] Failed to join room:', error)
        console.error('[ROOMSTORE] Error details:', error.message, error.response?.data)
        const message = error?.message?.includes('gameNumber')
          ? error.message
          : '방 입장에 실패했습니다.'
        set(state => ({
          error: { ...state.error, room: message },
          loading: { ...state.loading, room: false }
        }))
        throw error
      }
    },

    getCurrentRoom: async (gameNumber) => {
      try {
        set(state => ({
          loading: { ...state.loading, room: true },
          error: { ...state.error, room: null }
        }))
        
        const roomData = await gameApi.getRoomDetails(gameNumber)
        
        if (!roomData) {
          throw new Error('방 정보를 찾을 수 없습니다.')
        }
        
        if (roomData.players && Array.isArray(roomData.players)) {
          roomData.players = roomData.players.map((player, index) => ({
            id: player.id || index + 1,
            nickname: player.nickname || `Player${index + 1}`,
            isHost: player.isHost || false,
            isAlive: player.isAlive !== false,
            avatar: player.avatar || null
          }))
        } else {
          roomData.players = []
        }
        
        set(state => ({
          currentRoom: roomData,
          loading: { ...state.loading, room: false }
        }))
        
        return roomData
        
      } catch (error) {
        console.error('Failed to get room details:', error)
        set(state => ({
          error: { ...state.error, room: '방 정보를 불러오는데 실패했습니다.' },
          loading: { ...state.loading, room: false }
        }))
        throw error
      }
    },

    leaveRoom: async (gameNumber) => {
      try {
        console.log('[DEBUG_LOG] Leaving room with gameNumber:', gameNumber)
        const response = await gameApi.leaveRoom({
          gameNumber: parseInt(gameNumber)
        })
        console.log('[DEBUG_LOG] Leave room response:', response)

        set({
          currentRoom: null,
          currentPage: 'lobby'
        })

        return response

      } catch (error) {
        console.error('Failed to leave room:', error)
        throw error
      }
    },

    fetchRoomDetails: async (gameNumber) => {
      try {
        set(state => ({
          loading: { ...state.loading, room: true },
          error: { ...state.error, room: null }
        }))
        
        const roomData = await gameApi.getRoomDetails(gameNumber)
        
        if (!roomData) {
          console.error('[DEBUG_LOG] No room details received')
          return null
        }

        const normalizedRoom = {
          gameNumber: roomData.gameNumber || gameNumber,
          title: roomData.title || roomData.gameName || `게임방 #${gameNumber}`,
          host: roomData.host || roomData.gameOwner || roomData.hostNickname || '알 수 없음',
          currentPlayers: parseInt(roomData.currentPlayers || roomData.playerCount || 0),
          maxPlayers: parseInt(roomData.maxPlayers || roomData.gameParticipants || 8),
          subject: roomData.subject || roomData.citizenSubject?.content || roomData.subjectName || '주제 없음',
          state: roomData.state || roomData.gameState || 'WAITING',
          round: parseInt(roomData.currentRound || roomData.gameCurrentRound || 1),
          players: Array.isArray(roomData.players) ? roomData.players : [],
          hasPassword: roomData.hasPassword || false,
          createdAt: roomData.createdAt,
          updatedAt: new Date().toISOString()
        }

        console.log('[DEBUG_LOG] Normalized room details:', normalizedRoom)

        set({ currentRoom: normalizedRoom })

        return normalizedRoom
      } catch (error) {
        console.error('[DEBUG_LOG] Failed to fetch room details:', error)
        throw error
      }
    },

    updateRoomInList: (updatedRoom) => {
      set(state => ({
        roomList: state.roomList.map(room =>
          room.gameNumber === updatedRoom.gameNumber
            ? { ...room, ...updatedRoom }
            : room
        )
      }))
    },

    // Navigation
    navigateToLobby: () => {
      set({
        currentPage: 'lobby',
        currentRoom: null
      })
    },

    clearError: (type) => {
      set(state => ({
        error: { ...state.error, [type]: null }
      }))
    },

    reset: () => {
      set({
        roomList: [],
        currentRoom: null,
        currentPage: 'lobby',
        loading: { rooms: false, room: false },
        error: { rooms: null, room: null }
      })
    }
  }))
)

useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useRoomStore.getState().reset()
    }
  }
)

export default useRoomStore