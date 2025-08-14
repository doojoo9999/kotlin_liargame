import { useEffect, useCallback, useRef } from 'react'

const DEFAULT_REFRESH_INTERVAL = 30000 // 30 seconds

/**
 * Hook for managing automatic periodic refresh with proper cleanup
 * Provides control over refresh interval and enable/disable functionality
 */
export default function useAutoRefresh({
  refreshFunctions = [],
  intervalMs = DEFAULT_REFRESH_INTERVAL,
  enabled = true
}) {
  const intervalRef = useRef(null)

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (enabled && refreshFunctions.length > 0) {
      console.log('[DEBUG_LOG] Starting auto-refresh with interval:', intervalMs)
      
      intervalRef.current = setInterval(async () => {
        console.log('[DEBUG_LOG] Auto-refreshing data...')
        
        try {
          // Execute all refresh functions
          await Promise.allSettled(
            refreshFunctions.map(fn => {
              if (typeof fn === 'function') {
                return fn()
              }
              return Promise.resolve()
            })
          )
          
          console.log('[DEBUG_LOG] Auto-refresh completed')
        } catch (error) {
          console.error('[DEBUG_LOG] Error during auto-refresh:', error)
        }
      }, intervalMs)
    }
  }, [refreshFunctions, intervalMs, enabled])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      console.log('[DEBUG_LOG] Stopping auto-refresh')
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const restartAutoRefresh = useCallback(() => {
    stopAutoRefresh()
    startAutoRefresh()
  }, [stopAutoRefresh, startAutoRefresh])

  // Start/stop auto-refresh based on enabled state and dependencies
  useEffect(() => {
    if (enabled && refreshFunctions.length > 0) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return stopAutoRefresh
  }, [enabled, refreshFunctions, startAutoRefresh, stopAutoRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return {
    startAutoRefresh,
    stopAutoRefresh,
    restartAutoRefresh,
    isActive: !!intervalRef.current
  }
}