import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../api/apiClient'
import { debugLog, queryLog } from '../../../utils/logger'

const QUERY_KEY = ['admin', 'players']

/**
 * Hook for managing connected players data with react-query v5
 * Provides proper caching, real-time updates, and player management capabilities
 */
export default function useAllPlayers() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      queryLog('Fetching all players')
      const response = await apiClient.get('/admin/players')
      return response.data.players || []
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    select: (data) => data || [], // Ensure always returns array
    onError: (error) => {
      debugLog('Failed to fetch players:', error)
    }
  })

  // Function to update specific player from WebSocket data
  const updatePlayer = (updatedPlayer) => {
    queryClient.setQueryData(QUERY_KEY, (oldPlayers) => {
      if (!oldPlayers) return [updatedPlayer]
      
      const existingIndex = oldPlayers.findIndex(player => player.id === updatedPlayer.id)
      
      if (existingIndex >= 0) {
        // Update existing player
        const newPlayers = [...oldPlayers]
        newPlayers[existingIndex] = { ...newPlayers[existingIndex], ...updatedPlayer }
        return newPlayers
      } else {
        // Add new player
        return [...oldPlayers, updatedPlayer]
      }
    })
  }

  // Function to remove a player
  const removePlayer = (playerId) => {
    queryClient.setQueryData(QUERY_KEY, (oldPlayers) => {
      if (!oldPlayers) return []
      return oldPlayers.filter(player => player.id !== playerId)
    })
  }

  // Function to replace all players (full update from WebSocket)
  const updateAllPlayers = (newPlayers) => {
    queryClient.setQueryData(QUERY_KEY, newPlayers || [])
  }

  // Function to manually refresh players
  const refreshPlayers = () => {
    return query.refetch()
  }

  // Function to invalidate and refetch players
  const invalidatePlayers = () => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  // Get player count by status
  const getPlayerCountByStatus = (status) => {
    if (!query.data) return 0
    return query.data.filter(player => player.status === status).length
  }

  // Get players by status
  const getPlayersByStatus = (status) => {
    if (!query.data) return []
    return query.data.filter(player => player.status === status)
  }

  return {
    players: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updatePlayer,
    removePlayer,
    updateAllPlayers,
    refreshPlayers,
    invalidatePlayers,
    getPlayerCountByStatus,
    getPlayersByStatus
  }
}