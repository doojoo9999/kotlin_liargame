import React, {useCallback, useMemo, useState} from 'react'
import {Box} from '@components/ui'
import {useResponsiveLayout} from '../../hooks/useGameLayout'

// Components
import ChatHeader from './components/ChatHeader'
import ChatMessages from './components/ChatMessages'
import ChatInputBar from './components/ChatInputBar'
import EmojiMenu from './components/EmojiMenu'

// Hooks
import {useOptimizedChatSync} from './hooks/useOptimizedChatSync'
import {useEmojiMenu} from './hooks/useEmojiMenu'
import {useChatPerfPanel} from './hooks/useChatPerfPanel'

/**
 * OptimizedEnhancedChatSystem - Refactored modular chat component
 * Maintains same external API while improving separation of concerns
 */
const OptimizedEnhancedChatSystem = ({
    messages = [],
    currentUser,
    onSendMessage,
    disabled = false,
    placeholder = "메시지를 입력하세요...",
    maxLength = 200
}) => {
    const { isMobile } = useResponsiveLayout()
    const isDarkMode = false // Default to light mode, can be made configurable later

    // Local input state
    const [inputValue, setInputValue] = useState('')

    // Chat optimization and message synchronization
    const { 
        messages: optimizedMessages, 
        isThrottling, 
        performanceStats 
    } = useOptimizedChatSync(messages, isMobile)

    // Performance panel management
    const { 
        shouldShowPanel, 
        panelData, 
        debugText,
        logPerformanceData 
    } = useChatPerfPanel(isThrottling, performanceStats, optimizedMessages.length)

    // Emoji menu management
    const handleEmojiSelect = useCallback((emoji) => {
        setInputValue(prev => prev + emoji)
    }, [])

    const { 
        emojiMenuAnchor, 
        isEmojiMenuOpen, 
        openEmojiMenu, 
        closeEmojiMenu, 
        handleEmojiSelect: handleEmojiMenuSelect 
    } = useEmojiMenu(handleEmojiSelect)

    // Get current user ID for message ownership detection
    const currentUserId = useMemo(() => {
        return currentUser?.id || currentUser?.playerId
    }, [currentUser])

    // Message sending handler
    const handleSendMessage = useCallback(() => {
        if (!inputValue.trim() || disabled) return
        
        onSendMessage(inputValue.trim())
        setInputValue('')
    }, [inputValue, disabled, onSendMessage])

    // Input change handler
    const handleInputChange = useCallback((value) => {
        setInputValue(value)
    }, [])

    // Log performance data (development mode only)
    React.useEffect(() => {
        logPerformanceData
    }, [logPerformanceData])

    const containerStyle = useMemo(() => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        transition: 'color 0.3s ease'
    }), [])

    return (
        <Box style={containerStyle}>
            {/* Performance indicator header */}
            <ChatHeader 
                shouldShowPanel={shouldShowPanel}
                panelData={panelData}
            />

            {/* Messages display area */}
            <ChatMessages
                messages={optimizedMessages}
                currentUserId={currentUserId}
                isDarkMode={isDarkMode}
                isMobile={isMobile}
            />

            {/* Input area with emoji and send buttons */}
            <ChatInputBar
                inputValue={inputValue}
                onInputChange={handleInputChange}
                onSendMessage={handleSendMessage}
                onEmojiButtonClick={openEmojiMenu}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={maxLength}
                isDarkMode={isDarkMode}
                isMobile={isMobile}
                debugText={debugText}
            />

            {/* Emoji selection menu */}
            <EmojiMenu
                anchorEl={emojiMenuAnchor}
                open={isEmojiMenuOpen}
                onClose={closeEmojiMenu}
                onEmojiSelect={handleEmojiMenuSelect}
                isMobile={isMobile}
            />
        </Box>
    )
}

// Export MESSAGE_TYPES for backward compatibility
export { MESSAGE_TYPES } from './utils/convertMessageFormat'

export default OptimizedEnhancedChatSystem