import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../api/apiClient'
import { getRoomStatusColor, getRoomStatusText } from '../../../utils/status'
import { debugLog, queryLog } from '../../../utils/logger'

const QUERY_KEY = ['game', 'rooms']

/**
 * Hook for managing game rooms data with react-query v5
 * Provides proper caching, real-time updates, and room management capabilities
 */
export default function useGameRooms() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      queryLog('Fetching game rooms')
      const response = await apiClient.get('/game/rooms')
      return response.data.gameRooms || []
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    select: (data) => data || [], // Ensure always returns array
    onError: (error) => {
      debugLog('Failed to fetch game rooms:', error)
    }
  })

  // Function to update a specific game room from WebSocket data
  const updateGameRoom = (updatedRoom) => {
    queryClient.setQueryData(QUERY_KEY, (oldRooms) => {
      if (!oldRooms) return [updatedRoom]
      
      const filteredRooms = oldRooms.filter(room => room.gameNumber !== updatedRoom.gameNumber)
      
      // Only add room if it's not ended/terminated
      if (updatedRoom.status !== 'ENDED' && updatedRoom.status !== 'TERMINATED') {
        return [...filteredRooms, updatedRoom]
      }
      
      return filteredRooms
    })
  }

  // Function to remove a terminated room
  const removeRoom = (gameNumber) => {
    queryClient.setQueryData(QUERY_KEY, (oldRooms) => {
      if (!oldRooms) return []
      return oldRooms.filter(room => room.gameNumber !== gameNumber)
    })
  }

  // Function to replace all rooms (full update)
  const updateAllRooms = (newRooms) => {
    queryClient.setQueryData(QUERY_KEY, newRooms || [])
  }

  // Function to manually refresh rooms
  const refreshRooms = () => {
    return query.refetch()
  }

  // Function to invalidate and refetch rooms
  const invalidateRooms = () => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }


  return {
    gameRooms: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateGameRoom,
    removeRoom,
    updateAllRooms,
    refreshRooms,
    invalidateRooms,
    getStatusColor: getRoomStatusColor,
    getStatusText: getRoomStatusText
  }
}