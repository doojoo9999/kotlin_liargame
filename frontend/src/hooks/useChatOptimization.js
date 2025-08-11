/**
 * Chat optimization hook for performance management
 * Handles message throttling, virtual scrolling, and memory optimization
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {validateMessageData} from '../utils/messageFormatter'

/**
 * Custom hook for chat performance optimization
 * @param {Object} options - Optimization options
 * @returns {Object} Optimization utilities and state
 */
export const useChatOptimization = (options = {}) => {
  const {
    maxMessages = 500,
    throttleDelay = 100,
    batchSize = 10,
    enableVirtualization = true,
    enableMessageLimiting = true,
    enableThrottling = true,
    debugMode = false
  } = options
  
  // State management
  const [messages, setMessages] = useState([])
  const [isThrottling, setIsThrottling] = useState(false)
  const [performanceStats, setPerformanceStats] = useState({
    messagesProcessed: 0,
    messagesDropped: 0,
    averageRenderTime: 0,
    memoryUsage: 0
  })
  
  // Refs for optimization
  const throttleTimeoutRef = useRef(null)
  const messageQueueRef = useRef([])
  const renderTimesRef = useRef([])
  const lastCleanupRef = useRef(Date.now())
  
  /**
   * Add performance measurement
   */
  const measureRenderTime = useCallback((startTime) => {
    const renderTime = performance.now() - startTime
    renderTimesRef.current.push(renderTime)
    
    // Keep only last 100 measurements
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100)
    }
    
    // Update average
    const avg = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
    setPerformanceStats(prev => ({
      ...prev,
      averageRenderTime: Math.round(avg * 100) / 100
    }))
  }, [])
  
  /**
   * Process message queue in batches
   */
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) {
      setIsThrottling(false)
      return
    }
    
    const startTime = performance.now()
    const batch = messageQueueRef.current.splice(0, batchSize)
    
    setMessages(prevMessages => {
      let newMessages = [...prevMessages, ...batch]
      
      // Limit messages if enabled
      if (enableMessageLimiting && newMessages.length > maxMessages) {
        const dropped = newMessages.length - maxMessages
        setPerformanceStats(prev => ({
          ...prev,
          messagesDropped: prev.messagesDropped + dropped
        }))
        newMessages = newMessages.slice(-maxMessages)
      }
      
      return newMessages
    })
    
    setPerformanceStats(prev => ({
      ...prev,
      messagesProcessed: prev.messagesProcessed + batch.length
    }))
    
    measureRenderTime(startTime)
    
    if (debugMode) {
      console.log('[DEBUG_LOG] Processed message batch:', batch.length, 'messages')
    }
    
    // Process remaining messages
    if (messageQueueRef.current.length > 0) {
      throttleTimeoutRef.current = setTimeout(processMessageQueue, throttleDelay)
    } else {
      setIsThrottling(false)
    }
  }, [batchSize, enableMessageLimiting, maxMessages, measureRenderTime, throttleDelay, debugMode])
  
  /**
   * Add messages with optimization
   */
  const addMessages = useCallback((newMessages) => {
    if (!Array.isArray(newMessages)) {
      newMessages = [newMessages]
    }
    
    // Validate messages
    const validMessages = newMessages.filter(message => {
      const validation = validateMessageData(message)
      if (!validation.isValid && debugMode) {
        console.warn('[DEBUG_LOG] Invalid message:', message, validation.errors)
      }
      return validation.isValid
    })
    
    if (validMessages.length === 0) return
    
    if (enableThrottling && validMessages.length > 1) {
      // Add to queue for batch processing
      messageQueueRef.current.push(...validMessages)
      
      if (!isThrottling) {
        setIsThrottling(true)
        processMessageQueue()
      }
    } else {
      // Add immediately for single messages
      const startTime = performance.now()
      
      setMessages(prevMessages => {
        let newMessages = [...prevMessages, ...validMessages]
        
        if (enableMessageLimiting && newMessages.length > maxMessages) {
          const dropped = newMessages.length - maxMessages
          setPerformanceStats(prev => ({
            ...prev,
            messagesDropped: prev.messagesDropped + dropped
          }))
          newMessages = newMessages.slice(-maxMessages)
        }
        
        return newMessages
      })
      
      setPerformanceStats(prev => ({
        ...prev,
        messagesProcessed: prev.messagesProcessed + validMessages.length
      }))
      
      measureRenderTime(startTime)
    }
  }, [enableThrottling, isThrottling, processMessageQueue, enableMessageLimiting, maxMessages, measureRenderTime, debugMode])
  
  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([])
    messageQueueRef.current = []
    setPerformanceStats({
      messagesProcessed: 0,
      messagesDropped: 0,
      averageRenderTime: 0,
      memoryUsage: 0
    })
    
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
      throttleTimeoutRef.current = null
    }
    
    setIsThrottling(false)
  }, [])
  
  /**
   * Memory optimization - periodic cleanup
   */
  const performMemoryCleanup = useCallback(() => {
    const now = Date.now()
    const timeSinceLastCleanup = now - lastCleanupRef.current
    
    // Cleanup every 30 seconds
    if (timeSinceLastCleanup > 30000) {
      // Force garbage collection if available
      if (window.gc && typeof window.gc === 'function') {
        try {
          window.gc()
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Update memory usage stats
      if (performance.memory) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        setPerformanceStats(prev => ({
          ...prev,
          memoryUsage: memoryMB
        }))
      }
      
      lastCleanupRef.current = now
      
      if (debugMode) {
        console.log('[DEBUG_LOG] Memory cleanup performed. Messages:', messages.length)
      }
    }
  }, [messages.length, debugMode])
  
  /**
   * Virtual scrolling helpers
   */
  const virtualScrollHelpers = useMemo(() => {
    if (!enableVirtualization) return null
    
    return {
      getItemHeight: (index) => {
        // Return consistent height for virtual scrolling
        return 46 // CHAT_DESIGN_CONSTANTS.MESSAGE_HEIGHT.COMPACT + margins
      },
      
      getEstimatedTotalHeight: (itemCount) => {
        return itemCount * 46
      },
      
      shouldItemUpdate: (prevProps, nextProps) => {
        return (
          prevProps.index !== nextProps.index ||
          prevProps.data.messages[prevProps.index]?.id !== nextProps.data.messages[nextProps.index]?.id
        )
      }
    }
  }, [enableVirtualization])
  
  /**
   * Performance monitoring
   */
  const getPerformanceReport = useCallback(() => {
    return {
      ...performanceStats,
      currentMessageCount: messages.length,
      queuedMessages: messageQueueRef.current.length,
      isThrottling,
      averageMessageSize: messages.length > 0 ? 
        JSON.stringify(messages).length / messages.length : 0,
      renderTimes: renderTimesRef.current.slice(-10) // Last 10 render times
    }
  }, [performanceStats, messages, isThrottling])
  
  /**
   * Optimize for mobile devices
   */
  const mobileOptimizations = useMemo(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (!isMobile) return {}
    
    return {
      reducedBatchSize: Math.floor(batchSize / 2),
      increasedThrottleDelay: throttleDelay * 1.5,
      reducedMaxMessages: Math.floor(maxMessages * 0.75)
    }
  }, [batchSize, throttleDelay, maxMessages])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [])
  
  // Periodic memory cleanup
  useEffect(() => {
    const cleanup = setInterval(performMemoryCleanup, 30000)
    return () => clearInterval(cleanup)
  }, [performMemoryCleanup])
  
  return {
    // Core functionality
    messages,
    addMessages,
    clearMessages,
    
    // Performance state
    isThrottling,
    performanceStats,
    
    // Virtual scrolling
    virtualScrollHelpers,
    
    // Performance monitoring
    getPerformanceReport,
    
    // Mobile optimizations
    mobileOptimizations,
    
    // Utility functions
    isOptimizationEnabled: enableVirtualization || enableThrottling || enableMessageLimiting,
    queueLength: messageQueueRef.current.length
  }
}

/**
 * Lightweight version for simple chat components
 */
export const useChatOptimizationLite = (maxMessages = 100) => {
  const [messages, setMessages] = useState([])
  
  const addMessages = useCallback((newMessages) => {
    if (!Array.isArray(newMessages)) {
      newMessages = [newMessages]
    }
    
    setMessages(prevMessages => {
      const combined = [...prevMessages, ...newMessages]
      return combined.length > maxMessages ? combined.slice(-maxMessages) : combined
    })
  }, [maxMessages])
  
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])
  
  return {
    messages,
    addMessages,
    clearMessages
  }
}

/**
 * Hook for message batching optimization
 */
export const useMessageBatching = (delay = 100) => {
  const [batchedMessages, setBatchedMessages] = useState([])
  const timeoutRef = useRef(null)
  const queueRef = useRef([])
  
  const addToBatch = useCallback((message) => {
    queueRef.current.push(message)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setBatchedMessages(prev => [...prev, ...queueRef.current])
      queueRef.current = []
    }, delay)
  }, [delay])
  
  const clearBatch = useCallback(() => {
    setBatchedMessages([])
    queueRef.current = []
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return {
    batchedMessages,
    addToBatch,
    clearBatch,
    hasPendingMessages: queueRef.current.length > 0
  }
}

export default useChatOptimization