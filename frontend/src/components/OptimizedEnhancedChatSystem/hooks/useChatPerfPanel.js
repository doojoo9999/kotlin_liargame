import { useMemo } from 'react'
import { debugLog } from '../../../../utils/logger'

/**
 * Custom hook for managing performance panel display and statistics
 * @param {boolean} isThrottling - Whether chat is currently throttling
 * @param {Object} performanceStats - Performance statistics object
 * @param {number} messageCount - Current message count
 * @returns {Object} Performance panel state and helpers
 */
export const useChatPerfPanel = (isThrottling, performanceStats, messageCount) => {
    // Performance panel should only show in development mode
    const shouldShowPanel = useMemo(() => {
        return process.env.NODE_ENV === 'development' && isThrottling
    }, [isThrottling])

    // Log performance data for debugging
    const logPerformanceData = useMemo(() => {
        debugLog('OptimizedEnhancedChatSystem - messages:', messageCount)
        debugLog('OptimizedEnhancedChatSystem - isThrottling:', isThrottling)
        
        return {
            messageCount,
            isThrottling,
            performanceStats
        }
    }, [messageCount, isThrottling, performanceStats])

    // Performance panel data for display
    const panelData = useMemo(() => ({
        messagesProcessed: performanceStats?.messagesProcessed || 0,
        isThrottling,
        messageCount
    }), [performanceStats, isThrottling, messageCount])

    // Helper text for development debugging
    const debugText = useMemo(() => {
        if (process.env.NODE_ENV !== 'development') return ''
        return `${messageCount} 메시지 렌더링됨`
    }, [messageCount])

    return {
        shouldShowPanel,
        panelData,
        debugText,
        logPerformanceData
    }
}

export default useChatPerfPanel