/**
 * Message queue hook for throttled batch processing
 * Handles message queuing, throttling, and adaptive batch processing
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { validateMessageData } from '../../../utils/messageFormatter'
import { queueLog } from '../utils/logger.js'

/**
 * Custom hook for message queue management with throttling
 * @param {import('./types.js').MessageQueueOptions} options - Queue configuration
 * @returns {import('./types.js').MessageQueueResult} Queue management functions
 */
export const useMessageQueue = ({
  enableThrottling = true,
  batchSize = 20,
  throttleDelay = 100,
  debugMode = false,
  onBatchProcessed = () => {}
}) => {
  const [isThrottling, setIsThrottling] = useState(false)
  
  const throttleTimeoutRef = useRef(null)
  const messageQueueRef = useRef([])

  // Constants for adaptive batch processing
  const MAX_BATCH_ON_BACKLOG = 500
  const HIGH_BACKLOG_THRESHOLD = 1000

  /**
   * Process the message queue with adaptive batching
   */
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) {
      setIsThrottling(false)
      return
    }

    const backlog = messageQueueRef.current.length

    // Adaptive batch size: larger batches for high backlog
    const effectiveBatchSize = enableThrottling
      ? (backlog > HIGH_BACKLOG_THRESHOLD ? Math.min(backlog, MAX_BATCH_ON_BACKLOG) : batchSize)
      : backlog

    const batch = messageQueueRef.current.splice(0, effectiveBatchSize)

    queueLog(debugMode, `batch: ${batch.length}, backlog: ${messageQueueRef.current.length}`)

    // Notify parent of processed batch
    onBatchProcessed(batch)

    // Continue processing if more messages remain
    if (messageQueueRef.current.length > 0) {
      // No delay for high backlog situations
      const delay = backlog > HIGH_BACKLOG_THRESHOLD ? 0 : throttleDelay
      throttleTimeoutRef.current = setTimeout(processMessageQueue, delay)
    } else {
      setIsThrottling(false)
    }
  }, [batchSize, enableThrottling, throttleDelay, debugMode, onBatchProcessed])

  /**
   * Add messages to the queue
   * @param {Array|Object} newMessages - Messages to add
   */
  const enqueue = useCallback((newMessages) => {
    if (!Array.isArray(newMessages)) {
      newMessages = [newMessages]
    }

    // Validate messages before adding to queue
    const validMessages = newMessages.filter(msg => {
      const validation = validateMessageData(msg)
      if (!validation.isValid && debugMode) {
        queueLog(debugMode, `Invalid message: ${JSON.stringify(msg)}, errors: ${validation.errors}`)
      }
      return validation.isValid
    })

    if (validMessages.length === 0) return

    // For single messages or when throttling is disabled, process immediately
    if (!enableThrottling || validMessages.length === 1) {
      onBatchProcessed(validMessages)
      return
    }

    // Add to queue and start processing if not already throttling
    messageQueueRef.current.push(...validMessages)
    if (!isThrottling) {
      setIsThrottling(true)
      processMessageQueue()
    }
  }, [enableThrottling, isThrottling, processMessageQueue, debugMode, onBatchProcessed])

  /**
   * Force flush the queue immediately
   */
  const flushNow = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
      throttleTimeoutRef.current = null
    }
    
    if (messageQueueRef.current.length > 0) {
      const allMessages = messageQueueRef.current.splice(0)
      queueLog(debugMode, `Force flush: ${allMessages.length} messages`)
      onBatchProcessed(allMessages)
    }
    
    setIsThrottling(false)
  }, [debugMode, onBatchProcessed])

  /**
   * Clear the queue and stop processing
   */
  const clearQueue = useCallback(() => {
    messageQueueRef.current = []
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
      throttleTimeoutRef.current = null
    }
    setIsThrottling(false)
  }, [])

  /**
   * Cleanup function to dispose of resources
   */
  const dispose = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
      throttleTimeoutRef.current = null
    }
    messageQueueRef.current = []
    setIsThrottling(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [])

  return {
    enqueue,
    isThrottling,
    queueLength: messageQueueRef.current.length,
    flushNow,
    clearQueue,
    dispose
  }
}

export default useMessageQueue