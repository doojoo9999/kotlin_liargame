/**
 * Memory cleanup hook for managing message limits and memory usage
 * Handles proactive cleanup, memory monitoring, and message trimming
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { memoryLog } from '../utils/logger.js'

/**
 * Custom hook for memory cleanup and message limiting
 * @param {import('./types.js').MemoryCleanupOptions} options - Memory cleanup configuration
 * @returns {import('./types.js').MemoryCleanupResult} Memory management functions
 */
export const useMemoryCleanup = ({
  maxMessages = 100000,
  enableLimit = true,
  debugMode = false
}) => {
  const [memoryStats, setMemoryStats] = useState({
    memoryUsage: 0,
    lastCleanup: Date.now()
  })

  const lastCleanupRef = useRef(Date.now())
  const cleanupIntervalRef = useRef(null)

  // Constants for cleanup thresholds
  const HIGH_MESSAGE_COUNT = 5000
  const FAST_CLEANUP_INTERVAL = 15000  // 15 seconds for high message count
  const NORMAL_CLEANUP_INTERVAL = 30000 // 30 seconds for normal operation
  const CLEANUP_THRESHOLD = 0.8        // Cleanup when 80% of max reached
  const KEEP_RATIO = 0.6              // Keep 60% after cleanup

  /**
   * Check if performance.memory is available and safe to use
   * @returns {boolean} True if memory API is available
   */
  const isMemoryAPIAvailable = useCallback(() => {
    try {
      return typeof performance !== 'undefined' && 
             performance.memory && 
             typeof performance.memory.usedJSHeapSize === 'number'
    } catch (error) {
      memoryLog(debugMode, `Memory API not available: ${error.message}`)
      return false
    }
  }, [debugMode])

  /**
   * Get current memory usage in MB
   * @returns {number} Memory usage in MB, or 0 if unavailable
   */
  const getCurrentMemoryUsage = useCallback(() => {
    if (!isMemoryAPIAvailable()) {
      return 0
    }

    try {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
      return memoryMB
    } catch (error) {
      memoryLog(debugMode, `Error reading memory usage: ${error.message}`)
      return 0
    }
  }, [isMemoryAPIAvailable, debugMode])

  /**
   * Clamp message list to maximum limits
   * @param {Array} messageList - Current message list
   * @returns {{nextList: Array, dropped: number}} Result with clamped list and dropped count
   */
  const clamp = useCallback((messageList) => {
    if (!enableLimit || !Number.isFinite(maxMessages)) {
      return { nextList: messageList, dropped: 0 }
    }

    if (messageList.length <= maxMessages) {
      return { nextList: messageList, dropped: 0 }
    }

    const dropped = messageList.length - maxMessages
    const nextList = messageList.slice(-maxMessages)

    memoryLog(debugMode, `Clamped messages: kept ${nextList.length}, dropped ${dropped}`)

    return { nextList, dropped }
  }, [enableLimit, maxMessages, debugMode])

  /**
   * Perform proactive cleanup when approaching limits
   * @param {Array} messageList - Current message list
   * @returns {{nextList: Array, dropped: number}} Result with cleaned list and dropped count
   */
  const performProactiveCleanup = useCallback((messageList) => {
    if (!enableLimit || !Number.isFinite(maxMessages)) {
      return { nextList: messageList, dropped: 0 }
    }

    const now = Date.now()
    const timeSinceLastCleanup = now - lastCleanupRef.current
    const cleanupInterval = messageList.length > HIGH_MESSAGE_COUNT ? 
      FAST_CLEANUP_INTERVAL : NORMAL_CLEANUP_INTERVAL

    // Check if cleanup is needed based on time and message count
    const needsCleanup = timeSinceLastCleanup > cleanupInterval && 
                        messageList.length > maxMessages * CLEANUP_THRESHOLD

    if (!needsCleanup) {
      return { nextList: messageList, dropped: 0 }
    }

    const keepCount = Math.floor(maxMessages * KEEP_RATIO)
    const removed = Math.max(0, messageList.length - keepCount)

    if (removed > 0) {
      const nextList = messageList.slice(-keepCount)
      lastCleanupRef.current = now

      memoryLog(debugMode, `Proactive cleanup: removed ${removed} messages, kept ${nextList.length}`)

      // Update memory stats
      const currentMemory = getCurrentMemoryUsage()
      setMemoryStats({
        memoryUsage: currentMemory,
        lastCleanup: now
      })

      return { nextList, dropped: removed }
    }

    return { nextList: messageList, dropped: 0 }
  }, [enableLimit, maxMessages, debugMode, getCurrentMemoryUsage])

  /**
   * Update memory statistics
   */
  const updateMemoryStats = useCallback(() => {
    const currentMemory = getCurrentMemoryUsage()
    setMemoryStats(prev => ({
      ...prev,
      memoryUsage: currentMemory
    }))

    memoryLog(debugMode, `Memory usage updated: ${currentMemory}MB`)
  }, [getCurrentMemoryUsage, debugMode])

  /**
   * Schedule memory cleanup based on current message count
   * @param {number} messageCount - Current number of messages
   */
  const schedule = useCallback((messageCount) => {
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current)
    }

    const interval = messageCount > HIGH_MESSAGE_COUNT ? 
      FAST_CLEANUP_INTERVAL : NORMAL_CLEANUP_INTERVAL

    cleanupIntervalRef.current = setInterval(() => {
      updateMemoryStats()
      memoryLog(debugMode, `Scheduled cleanup check: ${messageCount} messages`)
    }, interval)

    memoryLog(debugMode, `Cleanup scheduled: ${interval}ms interval`)
  }, [updateMemoryStats, debugMode])

  /**
   * Cleanup function to dispose of resources
   */
  const dispose = useCallback(() => {
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current)
      cleanupIntervalRef.current = null
    }
    
    lastCleanupRef.current = Date.now()
    setMemoryStats({
      memoryUsage: 0,
      lastCleanup: Date.now()
    })

    memoryLog(debugMode, 'Memory cleanup disposed')
  }, [debugMode])

  /**
   * Get current memory statistics
   * @returns {Object} Current memory stats
   */
  const getStats = useCallback(() => {
    return {
      ...memoryStats,
      timeSinceLastCleanup: Date.now() - lastCleanupRef.current,
      isMemoryAPIAvailable: isMemoryAPIAvailable(),
      cleanupThresholds: {
        highMessageCount: HIGH_MESSAGE_COUNT,
        fastInterval: FAST_CLEANUP_INTERVAL,
        normalInterval: NORMAL_CLEANUP_INTERVAL,
        cleanupThreshold: CLEANUP_THRESHOLD,
        keepRatio: KEEP_RATIO
      }
    }
  }, [memoryStats, isMemoryAPIAvailable])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [])

  return {
    clamp,
    performProactiveCleanup,
    schedule,
    dispose,
    updateMemoryStats,
    getStats,
    stats: memoryStats,
    isEnabled: enableLimit
  }
}

export default useMemoryCleanup