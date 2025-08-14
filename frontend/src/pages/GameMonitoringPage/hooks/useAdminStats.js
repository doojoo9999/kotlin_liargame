import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../../api/apiClient'
import { debugLog, queryLog } from '../../../utils/logger'

const QUERY_KEY = ['admin', 'stats']

/**
 * Hook for managing admin statistics data with react-query v5
 * Provides proper caching, stale time management, and update capabilities
 */
export default function useAdminStats() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      queryLog('Fetching admin stats')
      const response = await apiClient.get('/admin/stats')
      return response.data
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    onError: (error) => {
      debugLog('Failed to fetch admin stats:', error)
    }
  })

  // Function to update stats from real-time WebSocket data
  const updateStats = (newStats) => {
    queryClient.setQueryData(QUERY_KEY, (oldData) => ({
      ...oldData,
      ...newStats
    }))
  }

  // Function to manually refresh stats
  const refreshStats = () => {
    return query.refetch()
  }

  // Function to invalidate and refetch stats
  const invalidateStats = () => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  return {
    stats: query.data || {
      totalPlayers: 0,
      activeGames: 0,
      totalGames: 0,
      playersInLobby: 0
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateStats,
    refreshStats,
    invalidateStats
  }
}