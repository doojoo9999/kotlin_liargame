import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import * as gameApi from '../api/gameApi'
import useAuthStore from './authStore'

const useRoomStore = create(
  subscribeWithSelector((set, get) => ({
    // State
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

    // Actions
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
        
        // Get subject info if available
        const getSubjectById = async (subjectId) => {
          try {
            const allSubjects = await gameApi.getAllSubjects()
            const foundSubject = allSubjects.find(s => s.id === subjectId)
            return foundSubject || { id: subjectId, name: '알 수 없는 주제' }
          } catch (error) {
            console.error('Failed to get subject:', error)
            return { id: subjectId, name: '주제 오류' }
          }
        }

        const createdRoom = {
          gameNumber: result.gameNumber || result,
          title: roomData.gName,
          maxPlayers: roomData.gParticipants,
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
          password: roomData.gPassword,
          rounds: roomData.gTotalRounds
        }
        
        set(state => ({
          currentRoom: createdRoom,
          currentPage: 'room',
          loading: { ...state.loading, room: false }
        }))
        
        // Refresh room list
        get().fetchRooms()
        
        return createdRoom
      } catch (error) {
        console.error('Failed to create room:', error)
        set(state => ({
          error: { ...state.error, room: '방 생성에 실패했습니다.' },
          loading: { ...state.loading, room: false }
        }))
        throw error
      }
    },

    joinRoom: async (gameNumber, password = '') => {
      try {
        set(state => ({ 
          loading: { ...state.loading, room: true },
          error: { ...state.error, room: null }
        }))

        const response = await gameApi.joinRoom(gameNumber, password)

        set(state => ({
          currentRoom: response,
          currentPage: 'room',
          loading: { ...state.loading, room: false }
        }))

        // Note: WebSocket connection will be handled by socketStore
        return response
      } catch (error) {
        console.error('Failed to join room:', error)
        set(state => ({
          error: { ...state.error, room: '방 입장에 실패했습니다.' },
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
        
        // Validate and normalize player data
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
          gNumber: parseInt(gameNumber)
        })
        console.log('[DEBUG_LOG] Leave room response:', response)

        set({
          currentRoom: null,
          currentPage: 'lobby'
        })

        // Note: Other cleanup (players, game state) will be handled by respective stores
        return response

      } catch (error) {
        console.error('Failed to leave room:', error)
        throw error
      }
    },

    fetchRoomDetails: async (gameNumber) => {
      try {
        console.log('[DEBUG_LOG] Fetching room details for game:', gameNumber)

        const roomDetails = await gameApi.getRoomDetails(gameNumber)

        if (!roomDetails) {
          console.error('[DEBUG_LOG] No room details received')
          return null
        }

        const normalizedRoom = {
          gameNumber: roomDetails.gameNumber || gameNumber,
          title: roomDetails.title || roomDetails.gameName || `게임방 #${gameNumber}`,
          host: roomDetails.host || roomDetails.gameOwner || roomDetails.hostNickname || '알 수 없음',
          currentPlayers: parseInt(roomDetails.currentPlayers || roomDetails.playerCount || 0),
          maxPlayers: parseInt(roomDetails.maxPlayers || roomDetails.gameParticipants || 8),
          subject: roomDetails.subject || roomDetails.citizenSubject?.content || roomDetails.subjectName || '주제 없음',
          state: roomDetails.state || roomDetails.gameState || 'WAITING',
          round: parseInt(roomDetails.currentRound || roomDetails.gameCurrentRound || 1),
          players: Array.isArray(roomDetails.players) ? roomDetails.players : [],
          hasPassword: roomDetails.hasPassword || false,
          createdAt: roomDetails.createdAt,
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

    navigateToRoom: () => {
      set({ currentPage: 'room' })
    },

    // Clear errors
    clearError: (type) => {
      set(state => ({
        error: { ...state.error, [type]: null }
      }))
    },

    // Reset store
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

// Subscribe to auth changes to handle cleanup on logout
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useRoomStore.getState().reset()
    }
  }
)

export default useRoomStore