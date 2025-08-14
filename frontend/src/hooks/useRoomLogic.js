import {useCallback} from 'react'
import {createNewRoom, fetchAllRooms, getRoomDetails, joinExistingRoom, leaveExistingRoom} from '../api/roomAPI.js'
import {getSubjectById} from '../api/subjectAPI.js'
import {ActionTypes} from '../state/gameActions.js'

// Room Management Business Logic Hook
// This module handles room management logic with state management integration

export const useRoomLogic = (state, dispatch, setLoading, setError, connectToRoom) => {
  
  const fetchRooms = useCallback(async () => {
    try {
      setLoading('rooms', true)
      setError('rooms', null)

      const mappedRooms = await fetchAllRooms()
      console.log('[DEBUG] Mapped rooms:', mappedRooms.length)
      
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: mappedRooms })
      setLoading('rooms', false)

    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      setError('rooms', '방 목록을 불러오는데 실패했습니다.')
      dispatch({ type: ActionTypes.SET_ROOM_LIST, payload: [] })
      setLoading('rooms', false)
    }
  }, [dispatch, setLoading, setError])

  const createRoom = useCallback(async (roomData) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      const createdRoom = await createNewRoom(roomData, state.currentUser, getSubjectById)
      
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: createdRoom })
      
      // Refresh room list
      await fetchRooms()
      
      setLoading('room', false)
      return createdRoom
    } catch (error) {
      console.error('Failed to create room:', error)
      setError('room', '방 생성에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [state.currentUser, dispatch, setLoading, setError, fetchRooms])

  const joinRoom = useCallback(async (gameNumber, password = '') => {
    try {
      setLoading('room', true)
      setError('room', null)

      const response = await joinExistingRoom(gameNumber, password)

      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: response })

      await connectToRoom(gameNumber)

      setLoading('room', false)
      return response
    } catch (error) {
      console.error('Failed to join room:', error)
      setError('room', '방 입장에 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [dispatch, setLoading, setError, connectToRoom])

  const getCurrentRoom = useCallback(async (gameNumber) => {
    try {
      setLoading('room', true)
      setError('room', null)
      
      const roomData = await getRoomDetails(gameNumber)
      
      dispatch({ type: ActionTypes.SET_CURRENT_ROOM, payload: roomData })
      setLoading('room', false)
      return roomData
      
    } catch (error) {
      console.error('Failed to get room details:', error)
      setError('room', '방 정보를 불러오는데 실패했습니다.')
      setLoading('room', false)
      throw error
    }
  }, [dispatch, setLoading, setError])

  const leaveRoom = useCallback(async (gameNumber) => {
    try {
      console.log('[DEBUG_LOG] Leaving room with gameNumber:', gameNumber)
      const response = await leaveExistingRoom(gameNumber)

      dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
      dispatch({ type: ActionTypes.SET_ROOM_PLAYERS, payload: [] })
      dispatch({ type: ActionTypes.SET_GAME_STATUS, payload: 'WAITING' })
      
      return response
    } catch (error) {
      console.error('Failed to leave room:', error)
      throw error
    }
  }, [dispatch])

  const navigateToLobby = useCallback(() => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'lobby' })
    dispatch({ type: ActionTypes.CLEAR_CURRENT_ROOM })
  }, [dispatch])

  const navigateToRoom = useCallback(() => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: 'room' })
  }, [dispatch])

  return {
    fetchRooms,
    createRoom,
    joinRoom,
    getCurrentRoom,
    leaveRoom,
    navigateToLobby,
    navigateToRoom
  }
}