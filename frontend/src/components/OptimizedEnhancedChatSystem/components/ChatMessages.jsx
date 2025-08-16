import React from 'react'
import {Box} from '@components/ui'
import ChatMessageList from '../../ChatMessageList'
import {debugLog} from '../../../utils/logger'

/**
 * ChatMessages component wrapper for ChatMessageList
 * @param {Array} messages - Optimized messages array
 * @param {string} currentUserId - Current user ID for message ownership
 * @param {boolean} isDarkMode - Dark mode flag
 * @param {boolean} isMobile - Mobile device flag for responsive styling
 */
const ChatMessages = React.memo(({ 
    messages, 
    currentUserId, 
    isDarkMode, 
    isMobile 
}) => {
    const handleScrollToBottom = React.useCallback(() => {
        if (process.env.NODE_ENV === 'development') {
            debugLog('Auto-scrolled to bottom')
        }
    }, [])

    return (
        <Box
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: isMobile ? '4px' : '8px'
            }}
        >
            <ChatMessageList
                messages={messages}
                currentUserId={currentUserId}
                isDarkMode={isDarkMode}
                height="100%"
                autoScroll={true}
                maxMessages={10000}
                onScrollToBottom={handleScrollToBottom}
            />
        </Box>
    )
})

ChatMessages.displayName = 'ChatMessages'

export default ChatMessages