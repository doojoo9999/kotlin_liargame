/**
 * Chat optimization hook facade - main entry point
 * Orchestrates all internal hooks while preserving the external API contract
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMessageQueue } from './internals/useMessageQueue.js'
import { usePerfMetrics } from './internals/usePerfMetrics.js'
import { useMemoryCleanup } from './internals/useMemoryCleanup.js'
import { useVirtualScrollHelpers } from './internals/useVirtualScrollHelpers.js'
import { useMobileOptimizations } from './internals/useMobileOptimizations.js'

/**
 * Custom hook for chat performance optimization
 * @param {import('./internals/types.js').ChatOptimizationOptions} options - Optimization options
 * @returns {import('./internals/types.js').ChatOptimizationResult} Optimization utilities and state
 */
export const useChatOptimization = (options = {}) => {
  // Parse and normalize input options with defaults
  const {
    maxMessages = 100000,
    throttleDelay = 100,
    batchSize = 20,
    enableVirtualization = true,
    enableMessageLimiting = true,
    enableThrottling = true,
    debugMode = false
  } = options

  // Derived configuration
  const isFiniteLimit = Number.isFinite(maxMessages) && enableMessageLimiting

  // Main messages state
  const [messages, setMessages] = useState([])

  // Initialize performance metrics hook
  const perfMetrics = usePerfMetrics({
    windowSize: 100,
    debugMode
  })

  // Initialize memory cleanup hook
  const memoryCleanup = useMemoryCleanup({
    maxMessages,
    enableLimit: enableMessageLimiting,
    debugMode
  })

  // Initialize virtual scroll helpers
  const virtualScrollHelpers = useVirtualScrollHelpers({
    enableVirtualization,
    itemHeight: 46
  })

  // Initialize mobile optimizations
  const mobileOptimizations = useMobileOptimizations({
    batchSize,
    throttleDelay
  })

  // Handle batch processing from message queue
  const handleBatchProcessed = useCallback((batch) => {
    const startTime = perfMetrics.getTimer()()

    setMessages(prev => {
      let nextMessages = [...prev, ...batch]

      // Apply memory limits
      const { nextList, dropped } = memoryCleanup.clamp(nextMessages)
      nextMessages = nextList

      // Update performance stats
      perfMetrics.updateStats(batch.length, dropped)

      // Measure render time
      perfMetrics.measure(startTime)

      return nextMessages
    })
  }, [perfMetrics, memoryCleanup])

  // Initialize message queue hook
  const messageQueue = useMessageQueue({
    enableThrottling,
    batchSize,
    throttleDelay,
    debugMode,
    onBatchProcessed: handleBatchProcessed
  })

  // Main addMessages function
  const addMessages = useCallback((newMessages) => {
    if (!Array.isArray(newMessages)) {
      newMessages = [newMessages]
    }

    if (newMessages.length === 0) return

    // Use message queue for processing
    messageQueue.enqueue(newMessages)
  }, [messageQueue])

  // Clear messages function
  const clearMessages = useCallback(() => {
    setMessages([])
    messageQueue.clearQueue()
    perfMetrics.reset()
  }, [messageQueue, perfMetrics])

  // Get performance report function
  const getPerformanceReport = useCallback(() => {
    return perfMetrics.getDetailedReport(
      messages.length,
      messageQueue.queueLength,
      messageQueue.isThrottling,
      messages
    )
  }, [perfMetrics, messages, messageQueue])

  // Schedule memory cleanup when message count changes
  useEffect(() => {
    memoryCleanup.schedule(messages.length)
  }, [messages.length, memoryCleanup])

  // Perform proactive cleanup periodically
  useEffect(() => {
    const cleanup = () => {
      setMessages(prev => {
        const { nextList, dropped } = memoryCleanup.performProactiveCleanup(prev)
        if (dropped > 0) {
          perfMetrics.updateStats(0, dropped)
        }
        return nextList
      })
    }

    // Schedule based on message count
    const interval = messages.length > 5000 ? 15000 : 30000
    const intervalId = setInterval(cleanup, interval)

    return () => clearInterval(intervalId)
  }, [messages.length, memoryCleanup, perfMetrics])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      messageQueue.dispose()
      perfMetrics.dispose()
      memoryCleanup.dispose()
    }
  }, [messageQueue, perfMetrics, memoryCleanup])

  // Assemble the return interface (preserving exact API contract)
  return {
    messages,
    addMessages,
    clearMessages,
    isThrottling: messageQueue.isThrottling,
    performanceStats: {
      messagesProcessed: perfMetrics.stats.messagesProcessed,
      messagesDropped: perfMetrics.stats.messagesDropped,
      averageRenderTime: perfMetrics.stats.averageRenderTime,
      memoryUsage: memoryCleanup.stats.memoryUsage
    },
    virtualScrollHelpers,
    getPerformanceReport,
    mobileOptimizations,
    isOptimizationEnabled: enableVirtualization || enableThrottling || isFiniteLimit,
    queueLength: messageQueue.queueLength
  }
}

// Export original lite version (unchanged behavior)
export const useChatOptimizationLite = (maxMessages = Infinity) => {
  const [messages, setMessages] = useState([])
  
  const addMessages = useCallback((newMessages) => {
    if (!Array.isArray(newMessages)) newMessages = [newMessages]
    setMessages(prev => {
      const combined = [...prev, ...newMessages]
      if (!Number.isFinite(maxMessages)) return combined
      return combined.length > maxMessages ? combined.slice(-maxMessages) : combined
    })
  }, [maxMessages])
  
  const clearMessages = useCallback(() => setMessages([]), [])
  
  return { messages, addMessages, clearMessages }
}

// Export original message batching hook (unchanged behavior)
export const useMessageBatching = (delay = 100) => {
  const [batchedMessages, setBatchedMessages] = useState([])
  const timeoutRef = useRef(null)
  const queueRef = useRef([])
  
  const addToBatch = useCallback((message) => {
    queueRef.current.push(message)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setBatchedMessages(prev => [...prev, ...queueRef.current])
      queueRef.current = []
    }, delay)
  }, [delay])
  
  const clearBatch = useCallback(() => {
    setBatchedMessages([])
    queueRef.current = []
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])
  
  useEffect(() => () => { 
    if (timeoutRef.current) clearTimeout(timeoutRef.current) 
  }, [])
  
  return { 
    batchedMessages, 
    addToBatch, 
    clearBatch, 
    hasPendingMessages: queueRef.current.length > 0 
  }
}

export default useChatOptimization