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
        maxMessages = 100000,
        throttleDelay = 100,
        batchSize = 20,
        enableVirtualization = true,
        enableMessageLimiting = true,
        enableThrottling = true,
        debugMode = false
    } = options

    const isFiniteLimit = Number.isFinite(maxMessages) && enableMessageLimiting

    const [messages, setMessages] = useState([])
    const [isThrottling, setIsThrottling] = useState(false)
    const [performanceStats, setPerformanceStats] = useState({
        messagesProcessed: 0,
        messagesDropped: 0,
        averageRenderTime: 0,
        memoryUsage: 0
    })

    const throttleTimeoutRef = useRef(null)
    const messageQueueRef = useRef([])
    const renderTimesRef = useRef([])
    const lastCleanupRef = useRef(Date.now())

    const measureRenderTime = useCallback((startTime) => {
        const renderTime = performance.now() - startTime
        renderTimesRef.current.push(renderTime)
        if (renderTimesRef.current.length > 100) {
            renderTimesRef.current = renderTimesRef.current.slice(-100)
        }
        const avg = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
        setPerformanceStats(prev => ({ ...prev, averageRenderTime: Math.round(avg * 100) / 100 }))
    }, [])

    // 적응형 배치 처리
    const processMessageQueue = useCallback(() => {
        if (messageQueueRef.current.length === 0) {
            setIsThrottling(false)
            return
        }

        const startTime = performance.now()
        const backlog = messageQueueRef.current.length

        // backlog가 크면 한 번에 더 많이 처리
        const MAX_BATCH_ON_BACKLOG = 500
        const effectiveBatchSize = enableThrottling
            ? (backlog > 1000 ? Math.min(backlog, MAX_BATCH_ON_BACKLOG) : batchSize)
            : backlog

        const batch = messageQueueRef.current.splice(0, effectiveBatchSize)

        setMessages(prev => {
            let next = [...prev, ...batch]
            if (isFiniteLimit && next.length > maxMessages) {
                const dropped = next.length - maxMessages
                setPerformanceStats(p => ({ ...p, messagesDropped: p.messagesDropped + dropped }))
                next = next.slice(-maxMessages)
            }
            return next
        })

        setPerformanceStats(prev => ({ ...prev, messagesProcessed: prev.messagesProcessed + batch.length }))
        measureRenderTime(startTime)

        if (debugMode) {
            console.log('[DEBUG_LOG] batch:', batch.length, 'backlog:', messageQueueRef.current.length)
        }

        if (messageQueueRef.current.length > 0) {
            // backlog가 크면 지연 없이 연달아 처리
            throttleTimeoutRef.current = setTimeout(processMessageQueue, backlog > 1000 ? 0 : throttleDelay)
        } else {
            setIsThrottling(false)
        }
    }, [batchSize, enableThrottling, isFiniteLimit, maxMessages, measureRenderTime, throttleDelay, debugMode])

    const addMessages = useCallback((newMessages) => {
        if (!Array.isArray(newMessages)) newMessages = [newMessages]

        const validMessages = newMessages.filter(msg => {
            const v = validateMessageData(msg)
            if (!v.isValid && debugMode) console.warn('[DEBUG_LOG] Invalid message:', msg, v.errors)
            return v.isValid
        })
        if (validMessages.length === 0) return

        if (enableThrottling && validMessages.length > 1) {
            messageQueueRef.current.push(...validMessages)
            if (!isThrottling) {
                setIsThrottling(true)
                processMessageQueue()
            }
        } else {
            const startTime = performance.now()
            setMessages(prev => {
                let next = [...prev, ...validMessages]
                if (isFiniteLimit && next.length > maxMessages) {
                    const dropped = next.length - maxMessages
                    setPerformanceStats(p => ({ ...p, messagesDropped: p.messagesDropped + dropped }))
                    next = next.slice(-maxMessages)
                }
                return next
            })
            setPerformanceStats(prev => ({ ...prev, messagesProcessed: prev.messagesProcessed + validMessages.length }))
            measureRenderTime(startTime)
        }
    }, [enableThrottling, isThrottling, processMessageQueue, isFiniteLimit, maxMessages, measureRenderTime, debugMode])

    const clearMessages = useCallback(() => {
        setMessages([])
        messageQueueRef.current = []
        setPerformanceStats({ messagesProcessed: 0, messagesDropped: 0, averageRenderTime: 0, memoryUsage: 0 })
        if (throttleTimeoutRef.current) { clearTimeout(throttleTimeoutRef.current); throttleTimeoutRef.current = null }
        setIsThrottling(false)
    }, [])

    const performMemoryCleanup = useCallback(() => {
        const now = Date.now()
        const timeSinceLastCleanup = now - lastCleanupRef.current
        const cleanupInterval = messages.length > 5000 ? 15000 : 30000
        if (timeSinceLastCleanup > cleanupInterval) {
            if (isFiniteLimit && messages.length > maxMessages * 0.8) {
                setMessages(prev => {
                    const keepCount = Math.floor(maxMessages * 0.6)
                    const removed = Math.max(0, prev.length - keepCount)
                    if (removed > 0) {
                        setPerformanceStats(p => ({ ...p, messagesDropped: p.messagesDropped + removed }))
                        if (debugMode) console.log(`[DEBUG_LOG] Proactive cleanup: -${removed}`)
                        return prev.slice(-keepCount)
                    }
                    return prev
                })
            }
            if (performance && performance.memory) {
                const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
                setPerformanceStats(p => ({ ...p, memoryUsage: memoryMB }))
            }
            lastCleanupRef.current = now
            if (debugMode) console.log('[DEBUG_LOG] Memory cleanup. count:', messages.length)
        }
    }, [messages.length, isFiniteLimit, maxMessages, debugMode])

    useEffect(() => {
        const interval = messages.length > 5000 ? 15000 : 30000
        const cleanup = setInterval(performMemoryCleanup, interval)
        return () => clearInterval(cleanup)
    }, [performMemoryCleanup, messages.length])

    const virtualScrollHelpers = useMemo(() => {
        if (!enableVirtualization) return null
        return {
            getItemHeight: () => 46,
            getEstimatedTotalHeight: (n) => n * 46,
            shouldItemUpdate: (prevProps, nextProps) =>
                prevProps.index !== nextProps.index ||
                prevProps.data.messages[prevProps.index]?.id !== nextProps.data.messages[nextProps.index]?.id
        }
    }, [enableVirtualization])

    const getPerformanceReport = useCallback(() => ({
        ...performanceStats,
        currentMessageCount: messages.length,
        queuedMessages: messageQueueRef.current.length,
        isThrottling,
        averageMessageSize: messages.length > 0 ? JSON.stringify(messages).length / messages.length : 0,
        renderTimes: renderTimesRef.current.slice(-10)
    }), [performanceStats, messages, isThrottling])

    const mobileOptimizations = useMemo(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (!isMobile) return {}
        return {
            reducedBatchSize: Math.floor(batchSize / 2),
            increasedThrottleDelay: throttleDelay * 1.5
        }
    }, [batchSize, throttleDelay])

    useEffect(() => () => { if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current) }, [])
    useEffect(() => {
        const cleanup = setInterval(performMemoryCleanup, 30000)
        return () => clearInterval(cleanup)
    }, [performMemoryCleanup])

    return {
        messages,
        addMessages,
        clearMessages,
        isThrottling,
        performanceStats,
        virtualScrollHelpers,
        getPerformanceReport,
        mobileOptimizations,
        isOptimizationEnabled: enableVirtualization || enableThrottling || isFiniteLimit,
        queueLength: messageQueueRef.current.length
    }
}

// Lite 버전은 Infinity면 자르지 않도록 유지 (변경 없음)
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
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])
    return { batchedMessages, addToBatch, clearBatch, hasPendingMessages: queueRef.current.length > 0 }
}

export default useChatOptimization
