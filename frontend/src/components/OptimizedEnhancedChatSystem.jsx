import React, {useEffect, useMemo, useRef, useState} from 'react'
import {
    Box,
    Divider,
    IconButton,
    InputAdornment,
    Menu,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import {EmojiEmotions as EmojiIcon, Send as SendIcon} from '@mui/icons-material'
import ChatMessageList from './ChatMessageList'
import {useChatOptimization} from '../hooks/useChatOptimization'
import {getChatThemeVariant, THEME_TRANSITIONS} from '../styles/themeVariants'

// Common emojis for the game
const GAME_EMOJIS = [
    '😀', '😂', '🤔', '😮', '😱', '🤨', '😏', '🙄',
    '👍', '👎', '👏', '🤝', '✋', '👋', '🤷', '🤦',
    '❤️', '💯', '🔥', '⭐', '❓', '❗', '💭', '💡',
    '🎭', '🕵️', '👥', '🎯', '🎲', '🏆', '⚡', '💀'
]

// Message types compatibility with the original system
export const MESSAGE_TYPES = {
    USER: 'user',
    SYSTEM: 'system',
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    GAME_EVENT: 'game_event'
}

/**
 * Convert original message format to our optimized format
 */
const convertMessageFormat = (message, index) => {
    // Determine if it's a system message
    const isSystem = message.type && [
        MESSAGE_TYPES.SYSTEM,
        MESSAGE_TYPES.INFO,
        MESSAGE_TYPES.WARNING,
        MESSAGE_TYPES.SUCCESS,
        MESSAGE_TYPES.GAME_EVENT
    ].includes(message.type)

    return {
        id: message.id || `msg-${index}-${Date.now()}`,
        content: message.content || '',
        playerNickname: message.playerNickname || message.sender,
        playerId: message.playerId || message.userId,
        sender: message.sender || message.playerNickname,
        timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
        isSystem: isSystem,
        type: message.type || 'user',
        // Additional metadata for enhanced features
        originalMessage: message
    }
}

const OptimizedEnhancedChatSystem = ({
                                         messages = [],
                                         currentUser,
                                         onSendMessage,
                                         disabled = false,
                                         placeholder = "메시지를 입력하세요...",
                                         maxLength = 200
                                     }) => {
    const theme = useTheme()
    const isDarkMode = theme.palette.mode === 'dark'
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const [inputValue, setInputValue] = useState('')
    const [emojiMenuAnchor, setEmojiMenuAnchor] = useState(null)
    const inputRef = useRef(null)

    // Convert messages to our optimized format
    const convertedMessages = useMemo(() => {
        return messages.map((message, index) => convertMessageFormat(message, index))
    }, [messages])

    // Chat optimization hook with enhanced settings
    const {
        messages: optimizedMessages,
        addMessages,
        clearMessages,
        isThrottling,
        performanceStats
    } = useChatOptimization({
        maxMessages: 500,
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

    // Get current user ID for message ownership detection
    const currentUserId = currentUser?.id || currentUser?.playerId

    // Get theme colors
    const chatTheme = getChatThemeVariant(isDarkMode)

    const handleSendMessage = () => {
        if (!inputValue.trim() || disabled) return

        onSendMessage(inputValue.trim())
        setInputValue('')
        inputRef.current?.focus()
    }

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSendMessage()
        }
    }

    const handleEmojiSelect = (emoji) => {
        setInputValue(prev => prev + emoji)
        setEmojiMenuAnchor(null)
        inputRef.current?.focus()
    }

    console.log('[DEBUG_LOG] OptimizedEnhancedChatSystem - messages:', optimizedMessages.length)
    console.log('[DEBUG_LOG] OptimizedEnhancedChatSystem - isThrottling:', isThrottling)

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                transition: THEME_TRANSITIONS.color
            }}
        >
            {/* Performance indicator (development only) */}
            {process.env.NODE_ENV === 'development' && isThrottling && (
                <Box sx={{
                    p: 0.5,
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText',
                    textAlign: 'center'
                }}>
                    <Typography variant="caption">
                        메시지 처리 중... ({performanceStats.messagesProcessed} 처리됨)
                    </Typography>
                </Box>
            )}

            {/* Optimized Messages area with virtualization */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    p: isMobile ? 0.5 : 1
                }}
            >
                <ChatMessageList
                    messages={optimizedMessages}
                    currentUserId={currentUserId}
                    isDarkMode={isDarkMode}
                    height="100%"
                    autoScroll={true}
                    maxMessages={500}
                    onScrollToBottom={() => {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('[DEBUG_LOG] Auto-scrolled to bottom')
                        }
                    }}
                />
            </Box>

            <Divider/>

            {/* Enhanced Input area */}
            <Box sx={{
                p: isMobile ? 1 : 2,
                backgroundColor: chatTheme.message.background,
                transition: THEME_TRANSITIONS.color
            }}>
                <TextField
                    ref={inputRef}
                    fullWidth
                    multiline
                    maxRows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.slice(0, maxLength))}
                    onKeyPress={handleKeyPress}
                    placeholder={disabled ? "채팅이 비활성화되었습니다..." : placeholder}
                    disabled={disabled}
                    size={isMobile ? 'small' : 'medium'}
                    autoFocus={!disabled} // 활성화되면 자동 포커스
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                            transition: THEME_TRANSITIONS.standard,
                            '&:hover': {
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                            },
                            '&.Mui-disabled': {
                                backgroundColor: 'action.disabledBackground',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'action.disabled'
                                }
                            }
                        }
                    }}

                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Box sx={{display: 'flex', gap: 0.5}}>
                                    {/* Emoji button */}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => setEmojiMenuAnchor(e.currentTarget)}
                                        disabled={disabled}
                                        sx={{
                                            transition: THEME_TRANSITIONS.standard,
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        <EmojiIcon/>
                                    </IconButton>

                                    {/* Send button with enhanced styling */}
                                    <IconButton
                                        size="small"
                                        onClick={handleSendMessage}
                                        disabled={disabled || !inputValue.trim()}
                                        color="primary"
                                        sx={{
                                            transition: THEME_TRANSITIONS.standard,
                                            '&:hover': {
                                                backgroundColor: 'primary.light',
                                                transform: 'scale(1.1)'
                                            },
                                            '&:disabled': {
                                                opacity: 0.5
                                            }
                                        }}
                                    >
                                        <SendIcon/>
                                    </IconButton>
                                </Box>
                            </InputAdornment>
                        )
                    }}
                    helperText={
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Typography variant="caption" sx={{opacity: 0.7}}>
                                {`${inputValue.length}/${maxLength}`}
                            </Typography>
                            {process.env.NODE_ENV === 'development' && (
                                <Typography variant="caption" sx={{opacity: 0.5}}>
                                    {optimizedMessages.length} 메시지 렌더링됨
                                </Typography>
                            )}
                        </Box>
                    }
                />

                {/* Enhanced Emoji menu */}
                <Menu
                    anchorEl={emojiMenuAnchor}
                    open={Boolean(emojiMenuAnchor)}
                    onClose={() => setEmojiMenuAnchor(null)}
                    PaperProps={{
                        sx: {
                            maxHeight: 200,
                            width: isMobile ? 280 : 320,
                            backgroundColor: 'background.paper',
                            transition: THEME_TRANSITIONS.standard
                        }
                    }}
                >
                    <Box sx={{p: 1}}>
                        <Typography
                            variant="caption"
                            sx={{
                                mb: 1,
                                display: 'block',
                                color: 'text.secondary'
                            }}
                        >
                            자주 사용하는 이모지
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(8, 1fr)',
                                gap: 0.5
                            }}
                        >
                            {GAME_EMOJIS.map((emoji, index) => (
                                <IconButton
                                    key={index}
                                    size="small"
                                    onClick={() => handleEmojiSelect(emoji)}
                                    sx={{
                                        fontSize: '1.2rem',
                                        transition: THEME_TRANSITIONS.fast,
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            transform: 'scale(1.2)'
                                        }
                                    }}
                                >
                                    {emoji}
                                </IconButton>
                            ))}
                        </Box>
                    </Box>
                </Menu>
            </Box>
        </Box>
    )
}

export default OptimizedEnhancedChatSystem