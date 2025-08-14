/**
 * Performance metrics hook for tracking render times and statistics
 * Handles render time measurement with sliding window averages
 */

import { useCallback, useRef, useState } from 'react'
import { perfLog } from '../utils/logger.js'
import { isPerformanceMonitoringEnabled } from '../utils/env.js'

/**
 * Custom hook for performance metrics tracking
 * @param {import('./types.js').PerfMetricsOptions} options - Performance metrics configuration
 * @returns {import('./types.js').PerfMetricsResult} Performance tracking functions
 */
export const usePerfMetrics = ({
  windowSize = 100,
  debugMode = false
}) => {
  const [stats, setStats] = useState({
    averageRenderTime: 0,
    messagesProcessed: 0,
    messagesDropped: 0
  })

  const renderTimesRef = useRef([])
  const isMonitoringEnabled = isPerformanceMonitoringEnabled()

  /**
   * Record a render time measurement
   * @param {number} startTime - Start time from performance.now()
   */
  const measure = useCallback((startTime) => {
    if (!isMonitoringEnabled || !startTime) {
      return
    }

    try {
      const renderTime = performance.now() - startTime
      
      // Add to sliding window
      renderTimesRef.current.push(renderTime)
      
      // Maintain window size
      if (renderTimesRef.current.length > windowSize) {
        renderTimesRef.current = renderTimesRef.current.slice(-windowSize)
      }
      
      // Calculate average
      const sum = renderTimesRef.current.reduce((acc, time) => acc + time, 0)
      const average = sum / renderTimesRef.current.length
      const roundedAverage = Math.round(average * 100) / 100
      
      setStats(prev => ({
        ...prev,
        averageRenderTime: roundedAverage
      }))

      perfLog(debugMode, `Render time: ${Math.round(renderTime * 100) / 100}ms, Average: ${roundedAverage}ms`)
      
    } catch (error) {
      perfLog(debugMode, `Error measuring render time: ${error.message}`)
    }
  }, [windowSize, debugMode, isMonitoringEnabled])

  /**
   * Update processing statistics
   * @param {number} processed - Number of messages processed
   * @param {number} dropped - Number of messages dropped (optional)
   */
  const updateStats = useCallback((processed, dropped = 0) => {
    setStats(prev => ({
      ...prev,
      messagesProcessed: prev.messagesProcessed + processed,
      messagesDropped: prev.messagesDropped + dropped
    }))

    if (dropped > 0) {
      perfLog(debugMode, `Messages processed: +${processed}, dropped: +${dropped}`)
    }
  }, [debugMode])

  /**
   * Get current performance statistics
   * @returns {Object} Current performance stats
   */
  const getCurrentStats = useCallback(() => {
    return {
      ...stats,
      sampleCount: renderTimesRef.current.length,
      recentRenderTimes: renderTimesRef.current.slice(-10) // Last 10 measurements
    }
  }, [stats])

  /**
   * Get detailed performance report
   * @param {number} currentMessageCount - Current message count
   * @param {number} queuedMessages - Number of queued messages
   * @param {boolean} isThrottling - Whether throttling is active
   * @param {Array} messages - Current messages for size calculation
   * @returns {import('./types.js').PerformanceReport} Detailed performance report
   */
  const getDetailedReport = useCallback((currentMessageCount, queuedMessages, isThrottling, messages = []) => {
    // Calculate average message size safely
    let averageMessageSize = 0
    try {
      if (messages.length > 0) {
        const totalSize = JSON.stringify(messages).length
        averageMessageSize = totalSize / messages.length
      }
    } catch (error) {
      perfLog(debugMode, `Error calculating message size: ${error.message}`)
    }

    return {
      ...stats,
      currentMessageCount,
      queuedMessages,
      isThrottling,
      averageMessageSize: Math.round(averageMessageSize),
      renderTimes: renderTimesRef.current.slice(-10),
      sampleCount: renderTimesRef.current.length,
      monitoringEnabled: isMonitoringEnabled
    }
  }, [stats, debugMode, isMonitoringEnabled])

  /**
   * Reset all performance metrics
   */
  const reset = useCallback(() => {
    renderTimesRef.current = []
    setStats({
      averageRenderTime: 0,
      messagesProcessed: 0,
      messagesDropped: 0
    })
    perfLog(debugMode, 'Performance metrics reset')
  }, [debugMode])

  /**
   * Cleanup function
   */
  const dispose = useCallback(() => {
    renderTimesRef.current = []
    setStats({
      averageRenderTime: 0,
      messagesProcessed: 0,
      messagesDropped: 0
    })
  }, [])

  /**
   * Get a performance timing function for measuring operations
   * @returns {function(): number} Timing function that returns start time
   */
  const getTimer = useCallback(() => {
    if (!isMonitoringEnabled) {
      return () => 0
    }
    return () => performance.now()
  }, [isMonitoringEnabled])

  return {
    measure,
    updateStats,
    stats,
    getCurrentStats,
    getDetailedReport,
    reset,
    dispose,
    getTimer,
    isEnabled: isMonitoringEnabled
  }
}

export default usePerfMetrics