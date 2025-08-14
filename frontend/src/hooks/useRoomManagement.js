import {useCallback, useEffect} from 'react'
import * as gameApi from '../api/gameApi'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useRoomManagement = (state, dispatch, { connectToRoom, getSubjectById }) => {
  // Helper function to set loading state
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])
  
  // Helper function to set error state
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // Fetch all rooms with normalization
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(LOADING_KEYS.ROOMS, true)
      setError(ERROR_KEYS.ROOMS, null)

      const rooms = await gameApi.getAllRooms()

      if (!Array.isArray(rooms)) {
        console.error('[ERROR] API response is not array:', rooms)
        dispatch({ type: ACTION_TYPES.SET_ROOM_LIST, payload: [] })
        setError(ERROR_KEYS.ROOMS, 'API 응답 오류가 발생했습니다.')
        setLoading(LOADING_KEYS.ROOMS, false)
        return
      }

      // Normalize room data
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
      dispatch({ type: ACTION_TYPES.SET_ROOM_LIST, payload: mappedRooms })
      setLoading(LOADING_KEYS.ROOMS, false)

    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setError(ERROR_KEYS.ROOMS, '방 목록을 불러오는데 실패했습니다.')
      dispatch({ type: ACTION_TYPES.SET_ROOM_LIST, payload: [] })
      setLoading(LOADING_KEYS.ROOMS, false)
    }
  }, [dispatch, setLoading, setError])

  // Create a new room
  const createRoom = useCallback(async (roomData) => {
    try {
      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)
      
      const result = await gameApi.createRoom(roomData)
      
      // Create room object with normalized data
      const createdRoom = {
        gameNumber: result.gameNumber || result,
        title: roomData.gameName,
        maxPlayers: roomData.gameParticipants,
        currentPlayers: 1,
        gameState: 'WAITING',
        subject: roomData.subjectIds?.length > 0 ? await getSubjectById(roomData.subjectIds[0]) : null,
        players: [{
          id: state.currentUser.id,
          nickname: state.currentUser.nickname,
          isHost: true,
          isAlive: true,
          avatarUrl: null
        }],
        password: roomData.gamePassword,
        rounds: roomData.gameTotalRounds
      }
      
      dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: createdRoom })
      
      // Refresh room list
      await fetchRooms()
      
      setLoading(LOADING_KEYS.ROOM, false)
      return createdRoom
    } catch (error) {
      console.error('Failed to create room:', error)
      setError(ERROR_KEYS.ROOM, '방 생성에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [state.currentUser, dispatch, setLoading, setError, getSubjectById, fetchRooms])

  // Join an existing room
  const joinRoom = useCallback(async (gameNumber, password = '') => {
    try {
      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)

      const response = await gameApi.joinRoom(gameNumber, password)

      dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: response })

      await connectToRoom(gameNumber)

      setLoading(LOADING_KEYS.ROOM, false)
      return response
    } catch (error) {
      console.error('Failed to join room:', error)
      setError(ERROR_KEYS.ROOM, '방 입장에 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [dispatch, setLoading, setError, connectToRoom])

  // Get detailed room information
  const getCurrentRoom = useCallback(async (gameNumber) => {
    try {
      setLoading(LOADING_KEYS.ROOM, true)
      setError(ERROR_KEYS.ROOM, null)
      
      const roomData = await gameApi.getRoomDetails(gameNumber)
      
      if (!roomData) {
        throw new Error('방 정보를 찾을 수 없습니다.')
      }
      
      // Validate and normalize player data
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
      
      dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: roomData })
      setLoading(LOADING_KEYS.ROOM, false)
      return roomData
      
    } catch (error) {
      console.error('Failed to get room details:', error)
      setError(ERROR_KEYS.ROOM, '방 정보를 불러오는데 실패했습니다.')
      setLoading(LOADING_KEYS.ROOM, false)
      throw error
    }
  }, [dispatch, setLoading, setError])

  // Leave current room
  const leaveRoom = useCallback(async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Leaving room with gameNumber:', gameNumber)
      const response = await gameApi.leaveRoom({
        gameNumber: parseInt(gameNumber)
      })
      console.log('[DEBUG_LOG] Leave room response:', response)

      // Clear room-related state
      dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROOM })
      dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: [] })
      dispatch({ type: ACTION_TYPES.SET_GAME_STATUS, payload: 'WAITING' })
      
      return response

    } catch (error) {
      console.error('Failed to leave room:', error)
      throw error
    }
  }, [dispatch])

  // Auto-fetch rooms when authenticated and on lobby page
  useEffect(() => {
    if (state.isAuthenticated && state.currentPage === 'lobby') {
      fetchRooms()
    }
  }, [state.isAuthenticated, state.currentPage, fetchRooms])

  return {
    fetchRooms,
    createRoom,
    joinRoom,
    getCurrentRoom,
    leaveRoom,
    roomList: state.roomList,
    currentRoom: state.currentRoom,
    loading: state.loading[LOADING_KEYS.ROOMS] || state.loading[LOADING_KEYS.ROOM],
    error: state.error[ERROR_KEYS.ROOMS] || state.error[ERROR_KEYS.ROOM]
  }
}