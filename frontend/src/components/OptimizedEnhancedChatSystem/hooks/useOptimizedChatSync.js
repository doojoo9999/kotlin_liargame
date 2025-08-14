import { useEffect, useMemo, useRef } from 'react'
import { useChatOptimization } from '../../../hooks/chat-optimization/useChatOptimization'
import { convertMessageFormat } from '../utils/convertMessageFormat'

/**
 * Custom hook for synchronizing external messages with useChatOptimization
 * @param {Array} messages - External messages array to sync
 * @param {boolean} isMobile - Mobile device flag for optimization settings
 * @returns {Object} Chat optimization state and methods
 */
export const useOptimizedChatSync = (messages = [], isMobile = false) => {
    // Convert messages to optimized format
    const convertedMessages = useMemo(() => {
        return messages.map((message, index) => convertMessageFormat(message, index))
    }, [messages])

    // Chat optimization hook with enhanced settings
    const {
        messages: optimizedMessages,
        addMessages,
        clearMessages,
        isThrottling,
        performanceStats,
        getPerformanceReport
    } = useChatOptimization({
        maxMessages: 10000,
        throttleDelay: isMobile ? 150 : 100,
        batchSize: isMobile ? 5 : 10,
        enableVirtualization: true,
        enableMessageLimiting: true,
        enableThrottling: true,
        debugMode: process.env.NODE_ENV === 'development'
    })

    // Keep track of last processed message count to avoid circular dependencies
    const lastProcessedCountRef = useRef(0)

    // Sync converted messages with optimization
    useEffect(() => {
        if (convertedMessages.length > 0) {
            // Only process if we have new messages
            if (convertedMessages.length > lastProcessedCountRef.current) {
                const newMessages = convertedMessages.slice(lastProcessedCountRef.current)

                if (newMessages.length > 0) {
                    addMessages(newMessages)
                    lastProcessedCountRef.current = convertedMessages.length
                }
            }
        } else if (convertedMessages.length === 0) {
            // Clear messages if no converted messages
            clearMessages()
            lastProcessedCountRef.current = 0
        }
    }, [convertedMessages, addMessages, clearMessages])

    return {
        messages: optimizedMessages,
        isThrottling,
        performanceStats,
        getPerformanceReport,
        // Internal methods (not typically needed by consumers)
        addMessages,
        clearMessages
    }
}

export default useOptimizedChatSync